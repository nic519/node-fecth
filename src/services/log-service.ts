import { getDb } from '@/db';
import { logs, NewLog } from '@/db/schema';
import { desc, eq, and, sql, count } from 'drizzle-orm';
import { LogLevel } from '@/types/log';

export interface LogEventParams {
  level: LogLevel;
  type: string;
  message: string;
  userId?: string;
  requestId?: string;
  meta?: Record<string, unknown>;
}

export class LogService {
  private db;

  constructor(env?: Env) {
    this.db = getDb(env);
  }

  /**
   * 记录一条日志
   * 为了性能，建议不要 await 这个方法，除非你需要确保日志写入成功
   */
  async log(params: LogEventParams) {
    const newLog: NewLog = {
      id: crypto.randomUUID(),
      level: params.level,
      type: params.type,
      message: params.message,
      userId: params.userId,
      requestId: params.requestId,
      meta: params.meta,
      createdAt: new Date().toISOString(),
    };

    try {
      await this.db.insert(logs).values(newLog).execute();

      // 概率性触发清理 (1% 概率)
      // 使用 waitUntil 如果在 Worker 环境，或者是 fire-and-forget
      if (Math.random() < 0.01) {
        // 不 await，让它在后台跑（但在 Serverless 环境要注意生命周期）
        // 如果是 Cloudflare Workers，最好用 ctx.waitUntil，但在 Service 类里拿不到 ctx
        // 这里只是简单的异步调用
        this.cleanupOldLogs(30).catch(e => console.error('Auto cleanup failed:', e));
      }

      return newLog;
    } catch (error) {
      console.error('Failed to write log to DB:', error);
      console.log(JSON.stringify(newLog));
      return null;
    }
  }

  /**
   * 查询日志
   */
  async queryLogs(options: {
    limit?: number;
    offset?: number;
    level?: LogLevel;
    type?: string;
    userId?: string;
    startTime?: Date;
    endTime?: Date;
  }) {
    const {
      limit = 50,
      offset = 0,
      level,
      type,
      userId,
      startTime,
      endTime
    } = options;

    const conditions = [];

    if (level) conditions.push(eq(logs.level, level));
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
    let dataQuery = this.db.select().from(logs);
    if (whereClause) {
      dataQuery = dataQuery.where(whereClause);
    }

    const data = await dataQuery.orderBy(desc(logs.createdAt)).limit(limit).offset(offset);

    return {
      data,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    };
  }

  /**
   * 清理过期日志
   * @param daysRetention 保留天数
   */
  async cleanupOldLogs(daysRetention: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysRetention);

    console.log(`Cleaning up logs older than ${cutoffDate.toISOString()}`);

    await this.db.delete(logs)
      .where(sql`${logs.createdAt} < ${cutoffDate.toISOString()}`)
      .execute();
  }
}

// Export a factory function
export const createLogService = (env?: Env) => new LogService(env);
