import type { DbInstance } from '@/server/db';
import { LogType, SUBSCRIPTION_REQUEST_LOG_MESSAGE } from '@/types/log';

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const HEADER_NAMES = [
  'x-real-ip', 'x-vercel-forwarded-for', 'x-forwarded-for', 'forwarded', 'cf-connecting-ip',
  'user-agent', 'x-vercel-ip-city', 'x-vercel-ip-country-region',
  'x-vercel-ip-country', 'x-vercel-ip-continent',
] as const;
const initialized = new WeakMap<DbInstance['$client'], Promise<void>>();

export async function ensureSubscriptionAnalytics(db: DbInstance): Promise<void> {
  const client = db.$client;
  const existing = initialized.get(client);
  if (existing) return existing;
  const initialization = (async () => {
    const safeMeta = "CASE WHEN json_valid(meta) THEN meta ELSE '{}' END";
    const headerFields = HEADER_NAMES.map((name) =>
      `'${name}', json_extract(${safeMeta}, '$.headers."${name}"')`).join(', ');
    await client.batch([
      `CREATE TABLE IF NOT EXISTS subscription_access (
        id TEXT PRIMARY KEY, user_id TEXT, headers TEXT NOT NULL, created_at TEXT NOT NULL
      )`,
      'CREATE INDEX IF NOT EXISTS subscription_access_created_idx ON subscription_access(created_at)',
      'CREATE TABLE IF NOT EXISTS subscription_analytics_migrations (id TEXT PRIMARY KEY)',
      {
        sql: `INSERT OR IGNORE INTO subscription_access (id, user_id, headers, created_at)
          SELECT 'legacy:' || id, user_id, json_object(${headerFields}), created_at FROM logs
          WHERE type = ? AND message = ? AND created_at >= ?
          AND NOT EXISTS (SELECT 1 FROM subscription_analytics_migrations WHERE id = 'legacy-access-v1')`,
        args: [LogType.SUBSCRIPTION_ACCESS, SUBSCRIPTION_REQUEST_LOG_MESSAGE,
          new Date(Date.now() - RETENTION_MS).toISOString()],
      },
      "INSERT OR IGNORE INTO subscription_analytics_migrations (id) VALUES ('legacy-access-v1')",
    ], 'write');
  })();
  initialized.set(client, initialization);
  try {
    await initialization;
  } catch (error) {
    initialized.delete(client);
    throw error;
  }
}

export async function recordSubscriptionAccess(db: DbInstance, request: Request, userId: string): Promise<void> {
  await ensureSubscriptionAnalytics(db);
  const headers: Record<string, string> = {};
  for (const name of HEADER_NAMES) {
    const value = request.headers.get(name);
    if (value !== null) headers[name] = value;
  }
  await db.$client.batch([{
    sql: 'INSERT INTO subscription_access (id, user_id, headers, created_at) VALUES (?, ?, ?, ?)',
    args: [crypto.randomUUID(), userId, JSON.stringify(headers), new Date().toISOString()],
  }, { sql: 'DELETE FROM subscription_access WHERE created_at < ?', args: [new Date(Date.now() - RETENTION_MS).toISOString()] }], 'write');
}

export async function cleanupSubscriptionAnalytics(db: DbInstance): Promise<void> {
  await ensureSubscriptionAnalytics(db);
  await db.$client.execute({
    sql: 'DELETE FROM subscription_access WHERE created_at < ?',
    args: [new Date(Date.now() - RETENTION_MS).toISOString()],
  });
}
