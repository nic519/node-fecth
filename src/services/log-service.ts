import { after } from 'next/server';
import type { DbInstance } from '@/server/db';
import { getServerDb } from '@/server/db';
import { logs, NewLog } from '@/db/schema';
import { asc, desc, eq, and, sql, count, inArray } from 'drizzle-orm';
import { LogLevel } from '@/types/log';
import { ensureSubscriptionAnalytics } from './subscription-analytics';
import { ensureRegistrationLimits } from './registration-limit';
import { LOG_CATEGORY_SQL, redactLogText, sanitizeLogMeta } from './log-policy';

export interface LogEventParams {
  level: LogLevel;
  type: string;
  message: string;
  userId?: string;
  requestId?: string;
  meta?: Record<string, unknown>;
}

export class LogService {
  constructor(private db: DbInstance) { }

  record(params: LogEventParams): void {
    try {
      after(() => this.log(params).then(() => undefined));
    } catch {
      console.error('业务日志任务调度失败');
    }
  }

  /**
   * 记录一条日志
   * 调用方等待写入，或使用请求生命周期支持的后台任务。
   */
  async log(params: LogEventParams) {
    try {
      await this.prepare();
      const newLog: NewLog = {
        id: crypto.randomUUID(), level: params.level, type: params.type.slice(0, 64),
        message: redactLogText(params.message, 256), userId: params.userId,
        requestId: params.requestId?.slice(0, 64), meta: sanitizeLogMeta(params.meta),
        createdAt: new Date().toISOString(),
      };
      await this.db.transaction(async tx => {
        await tx.insert(logs).values(newLog);
        await tx.run(sql.raw(this.pruneSql(newLog.userId ?? '')));
      });
      return newLog;
    } catch {
      console.error('业务日志写入失败');
      return null;
    }
  }

  private async prepare() {
    await this.db.$client.execute('CREATE TABLE IF NOT EXISTS log_migrations (id TEXT PRIMARY KEY)');
    const marker = await this.db.$client.execute("SELECT id FROM log_migrations WHERE id = 'bounded-v1'");
    if (marker.rows.length) return;
    await ensureSubscriptionAnalytics(this.db);
    await ensureRegistrationLimits(this.db);
    await this.db.$client.execute('CREATE INDEX IF NOT EXISTS logs_user_time_idx ON logs(user_id, created_at, id)');
    await this.db.$client.execute('CREATE INDEX IF NOT EXISTS logs_time_idx ON logs(created_at, id)');
    await this.db.transaction(async tx => {
      const existing = await tx.all<{ id: string }>(sql`SELECT id FROM log_migrations WHERE id = 'bounded-v1'`);
      if (existing.length) return;
      await tx.run(sql`UPDATE logs SET user_id = COALESCE(
        CASE WHEN json_valid(meta) THEN json_extract(meta, '$.targetUserId') END,
        CASE WHEN json_valid(meta) THEN json_extract(meta, '$.uid') END, user_id)`);
      await tx.run(sql.raw(this.pruneSql()));
      const legacy = await tx.select().from(logs);
      for (const row of legacy) {
        const meta = row.meta ?? {};
        const target = typeof meta.targetUserId === 'string' ? meta.targetUserId : typeof meta.uid === 'string' ? meta.uid : row.userId;
        await tx.update(logs).set({
          userId: target,
          message: redactLogText(row.message, 256),
          meta: sanitizeLogMeta({ ...meta, actorId: meta.adminId ?? meta.actorId }),
        }).where(eq(logs.id, row.id));
      }
      await tx.run(sql`INSERT INTO log_migrations (id) VALUES ('bounded-v1')`);
    });
  }

  private pruneSql(userId?: string) {
    const scope = userId === undefined ? '' : userId === '' ? "WHERE user_id IS NULL OR user_id = ''" : `WHERE user_id = '${userId.replaceAll("'", "''")}'`;
    return `DELETE FROM logs WHERE id IN (
      SELECT id FROM (
        SELECT id, created_at, category,
          ROW_NUMBER() OVER (PARTITION BY COALESCE(user_id, ''), category ORDER BY created_at DESC, id DESC) AS position
        FROM (SELECT *, ${LOG_CATEGORY_SQL} AS category FROM logs ${scope})
      ) WHERE position > CASE WHEN category = 'system' THEN 1000 ELSE 100 END
        OR julianday(created_at) < julianday('now') - CASE category WHEN 'success' THEN 3 WHEN 'problem' THEN 14 WHEN 'audit' THEN 30 ELSE 7 END
    )`;
  }

  /**
   * 查询日志
   */
  async queryLogs(options: {
    limit?: number;
    offset?: number;
    level?: LogLevel | 'problem';
    type?: string;
    userId?: string;
    startTime?: Date;
    endTime?: Date;
    order?: 'asc' | 'desc';
  }) {
    await this.cleanupOldLogs();
    const {
      limit = 50,
      offset = 0,
      level,
      type,
      userId,
      startTime,
      endTime,
      order = 'desc'
    } = options;

    const conditions = [];

    if (level === 'problem') conditions.push(inArray(logs.level, ['warn', 'error']));
    else if (level) conditions.push(eq(logs.level, level));
    if (type) conditions.push(eq(logs.type, type));
    if (userId) conditions.push(eq(logs.userId, userId));

    if (startTime) {
      conditions.push(sql`${logs.createdAt} >= ${startTime.toISOString()}`);
    }
    if (endTime) {
      conditions.push(sql`${logs.createdAt} <= ${endTime.toISOString()}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 获取总数
    let total = 0;
    try {
      const countResult = await this.db.select({ value: count() }).from(logs).where(whereClause);
      total = countResult[0]?.value || 0;
    } catch (e) {
      console.warn('Failed to count logs:', e);
    }

    // 获取数据
    const data = await this.db
      .select()
      .from(logs)
      .where(whereClause)
      .orderBy(order === 'asc' ? asc(logs.createdAt) : desc(logs.createdAt), order === 'asc' ? asc(logs.id) : desc(logs.id))
      .limit(limit)
      .offset(offset);

    return {
      data,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    };
  }

  /**
   * 清理过期日志
   */
  async cleanupOldLogs() {
    await this.prepare();
    await this.db.$client.execute(this.pruneSql());
  }

}

// Export a factory function
export const createLogService = (db?: DbInstance) => new LogService(db ?? getServerDb());
