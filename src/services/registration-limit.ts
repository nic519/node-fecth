import type { DbInstance } from '@/server/db';

const initialized = new WeakMap<DbInstance['$client'], Promise<void>>();

export function ensureRegistrationLimits(db: DbInstance): Promise<void> {
  const client = db.$client;
  const existing = initialized.get(client);
  if (existing) return existing;

  const initialization = client.batch([
    `CREATE TABLE IF NOT EXISTS registration_limits (
      ip TEXT PRIMARY KEY NOT NULL,
      reservation_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS registration_limits_expiry ON registration_limits(expires_at)`,
    `CREATE TABLE IF NOT EXISTS registration_limit_migrations (id TEXT PRIMARY KEY NOT NULL)`,
    `INSERT INTO registration_limits (ip, reservation_id, expires_at)
     SELECT json_extract(meta, '$.ip'), 'legacy', MAX(unixepoch(created_at) + 86400)
     FROM logs
     WHERE type = 'public_register'
       AND NOT EXISTS (SELECT 1 FROM registration_limit_migrations WHERE id = 'legacy_logs_v1')
       AND unixepoch(created_at) > unixepoch('now') - 86400
       AND CASE WHEN json_valid(meta) THEN json_type(meta, '$.ip') = 'text' ELSE 0 END
     GROUP BY json_extract(meta, '$.ip')
     ON CONFLICT(ip) DO UPDATE SET expires_at = MAX(registration_limits.expires_at, excluded.expires_at)`,
    `INSERT OR IGNORE INTO registration_limit_migrations (id) VALUES ('legacy_logs_v1')`,
  ], 'write').then(() => undefined).catch((error: unknown) => {
    initialized.delete(client);
    throw error;
  });
  initialized.set(client, initialization);
  return initialization;
}

export async function reserveRegistration(db: DbInstance, ip: string): Promise<string | null> {
  await cleanupRegistrationLimits(db);
  const reservationId = crypto.randomUUID();
  const result = await db.$client.execute({
    sql: `INSERT INTO registration_limits (ip, reservation_id, expires_at)
          VALUES (?, ?, unixepoch('now') + 86400)
          ON CONFLICT(ip) DO UPDATE SET reservation_id = excluded.reservation_id, expires_at = excluded.expires_at
          WHERE registration_limits.expires_at <= unixepoch('now')`,
    args: [ip, reservationId],
  });
  return result.rowsAffected === 1 ? reservationId : null;
}

export async function releaseRegistration(db: DbInstance, ip: string, reservationId: string): Promise<void> {
  await db.$client.execute({
    sql: 'DELETE FROM registration_limits WHERE ip = ? AND reservation_id = ?',
    args: [ip, reservationId],
  });
}

export async function cleanupRegistrationLimits(db: DbInstance): Promise<void> {
  await ensureRegistrationLimits(db);
  await db.$client.execute("DELETE FROM registration_limits WHERE expires_at <= unixepoch('now')");
}
