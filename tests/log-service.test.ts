import { AdminService } from '@/modules/user/admin.service';
import { redactLogText } from '@/services/log-policy';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@libsql/client';
import { expect, test } from 'bun:test';
import { drizzle } from 'drizzle-orm/libsql';

import * as schema from '@/db/schema';
import { LogService } from '@/services/log-service';
import { reserveRegistration } from '@/services/registration-limit';
import { getSubscriptionAnalytics } from '@/services/subscription-analytics';
import type { DbInstance } from '@/server/db';

async function setup() {
  const directory = mkdtempSync(join(tmpdir(), 'log-service-test-'));
  const client = createClient({ url: `file:${join(directory, 'logs.db')}` });
  await client.execute(`CREATE TABLE logs (
    id TEXT PRIMARY KEY, level TEXT NOT NULL, type TEXT NOT NULL, message TEXT NOT NULL,
    user_id TEXT, request_id TEXT, meta TEXT, created_at TEXT NOT NULL
  )`);
  const db = drizzle(client, { schema });
  return { db, service: new LogService(db), dispose() {
    client.close();
    rmSync(directory, { recursive: true, force: true });
  } };
}

async function seed(db: DbInstance, count: number, options: {
  userId?: string; level?: string; type?: string; daysAgo?: number;
  message?: string; meta?: Record<string, unknown>;
} = {}) {
  await db.$client.batch(Array.from({ length: count }, () => ({
    sql: 'INSERT INTO logs (id, level, type, message, user_id, meta, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [crypto.randomUUID(), options.level ?? 'info', options.type ?? 'subscription_access',
      options.message ?? 'event', options.userId ?? null, JSON.stringify(options.meta ?? {}),
      new Date(Date.now() - (options.daysAgo ?? 0) * 86400000).toISOString()],
  })), 'write');
}

test('logs cap each user category at 100 and the system category at 1000', async () => {
  const { db, service, dispose } = await setup();
  try {
    for (const level of ['info', 'error', 'audit']) await seed(db, 105, { userId: 'alice', level });
    await seed(db, 101, { userId: 'bob' });
    await seed(db, 1005);
    await service.cleanupOldLogs();
    const result = await db.$client.execute('SELECT user_id, level, COUNT(*) AS total FROM logs GROUP BY user_id, level');
    expect(result.rows.map(({ user_id, level, total }) => ({ user_id, level, total }))).toEqual([
      { user_id: null, level: 'info', total: 1000 },
      { user_id: 'alice', level: 'audit', total: 100 },
      { user_id: 'alice', level: 'error', total: 100 },
      { user_id: 'alice', level: 'info', total: 100 },
      { user_id: 'bob', level: 'info', total: 100 },
    ]);
    await service.log({ level: 'info', type: 'subscription_access', userId: 'alice', message: 'newest' });
    const current = await service.queryLogs({ userId: 'alice', level: 'info', limit: 100 });
    expect(current.total).toBe(100);
    expect(current.data.some(row => row.message === 'newest')).toBe(true);
  } finally { dispose(); }
});

test('reading quiet logs expires records by each category retention age', async () => {
  const { db, service, dispose } = await setup();
  try {
    for (const [level, daysAgo] of [['info', 4], ['error', 15], ['audit', 31]] as const) {
      await seed(db, 1, { userId: 'quiet', level, daysAgo });
      await seed(db, 1, { userId: 'quiet', level, daysAgo: daysAgo - 2 });
    }
    await seed(db, 1, { daysAgo: 8 });
    await seed(db, 1, { daysAgo: 6 });
    const result = await service.queryLogs({ limit: 100 });
    expect(result.total).toBe(4);
    expect(result.data.filter(row => row.userId === 'quiet')).toHaveLength(3);
  } finally { dispose(); }
});

test('failed audit actions cannot evict ordinary errors', async () => {
  const { db, service, dispose } = await setup();
  try {
    await seed(db, 100, { userId: 'alice', level: 'error', daysAgo: 1, message: 'ordinary failure' });
    await seed(db, 101, { userId: 'alice', level: 'error', type: 'user_update', message: 'audit failure' });
    await service.cleanupOldLogs();
    const result = await service.queryLogs({ userId: 'alice', level: 'problem', limit: 300 });
    expect(result.total).toBe(200);
    expect(result.data.filter(row => row.message === 'ordinary failure')).toHaveLength(100);
    expect(result.data.filter(row => row.message === 'audit failure')).toHaveLength(100);
  } finally { dispose(); }
});

test('pruning migrates registration limits and subscription history before deleting legacy logs', async () => {
  const { db, service, dispose } = await setup();
  try {
    await seed(db, 1, { type: 'public_register', daysAgo: 0.1, meta: { ip: '203.0.113.9' } });
    await seed(db, 1001);
    await seed(db, 1, { userId: 'alice', daysAgo: 5, message: '用户访问订阅配置',
      meta: { headers: { 'x-real-ip': '203.0.113.10', 'user-agent': 'Clash/1' } } });
    await service.cleanupOldLogs();
    const legacy = await db.$client.execute("SELECT id FROM logs WHERE type = 'public_register' OR user_id = 'alice'");
    expect(legacy.rows).toHaveLength(0);
    expect(await reserveRegistration(db, '203.0.113.9')).toBeNull();
    const analytics = await getSubscriptionAnalytics(db, { rangeDays: 7 });
    expect(analytics.totals.requests).toBe(1);
    expect(analytics.users[0].userId).toBe('alice');
    expect(analytics.users[0].ips[0].ip).toBe('203.0.113.10');
  } finally { dispose(); }
});

test('stored logs drop secret payloads and redact addresses in text', async () => {
  const { service, dispose } = await setup();
  try {
    await service.log({ level: 'error', type: 'subscription_access', userId: 'alice',
      message: 'Failed https://example.com/sub?token=secret password=hunter2',
      meta: { config: { token: 'secret' }, headers: { authorization: 'Bearer secret' },
        token: 'secret', stack: 'private stack', error: 'fetch https://example.com/private', durationMs: 12 } });
    const result = await service.queryLogs({});
    expect(result.total).toBe(1);
    expect(result.data[0].meta).toEqual({ error: 'fetch [地址已隐藏]', durationMs: 12 });
    expect(result.data[0].message).not.toContain('example.com');
    expect(result.data[0].message).not.toContain('hunter2');
    expect(JSON.stringify(result.data)).not.toContain('secret');
  } finally { dispose(); }
});

test('log database failures return null without rejecting the business operation', async () => {
  const { db, service, dispose } = await setup();
  db.$client.close();
  try {
    expect(await service.log({ level: 'info', type: 'test', message: 'event' })).toBeNull();
  } finally { dispose(); }
});

test('redacts bearer credentials and quoted secret fields', () => {
  for (const input of ['Authorization: Bearer demo-secret', '{"token":"demo-secret"}', 'access_token=demo-secret', 'api-key: demo-secret']) {
    expect(redactLogText(input)).not.toContain('demo-secret');
  }
});

test('admin log adapter keeps the actor distinct from the affected user', async () => {
  const { db, service, dispose } = await setup();
  try {
    await service.log({ level: 'audit', type: 'create_user', userId: 'alice', message: '创建用户',
      meta: { actorId: 'admin', targetId: 'alice', result: 'success' } });
    const result = await new AdminService(db, { logService: service }).getAdminLogs();
    expect(result[0]).toMatchObject({ adminId: 'admin', targetUserId: 'alice', result: 'success' });
  } finally { dispose(); }
});

test('failed analytics migration prevents log pruning and can be retried', async () => {
  const { db, service, dispose } = await setup();
  try {
    await seed(db, 1, { userId: 'alice', daysAgo: 5, message: '用户访问订阅配置',
      meta: { headers: { 'x-real-ip': '203.0.113.10' } } });
    await db.$client.execute('CREATE TABLE subscription_access (id TEXT PRIMARY KEY, user_id TEXT, headers TEXT NOT NULL, created_at TEXT NOT NULL)');
    await db.$client.execute("CREATE TRIGGER fail_copy BEFORE INSERT ON subscription_access BEGIN SELECT RAISE(ABORT, 'migration failed'); END");
    await expect(service.cleanupOldLogs()).rejects.toThrow('migration failed');
    expect((await db.$client.execute('SELECT id FROM logs')).rows).toHaveLength(1);
    await db.$client.execute('DROP TRIGGER fail_copy');
    await service.cleanupOldLogs();
    expect((await db.$client.execute('SELECT id FROM logs')).rows).toHaveLength(0);
    expect((await getSubscriptionAnalytics(db, { rangeDays: 7 })).totals.requests).toBe(1);
  } finally { dispose(); }
});
