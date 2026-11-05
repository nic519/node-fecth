import { createClient } from '@libsql/client';
import { expect, test } from 'bun:test';
import { drizzle } from 'drizzle-orm/libsql';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import * as schema from '@/db/schema';
import {
  cleanupSubscriptionAnalytics, ensureSubscriptionAnalytics,
  getSubscriptionAnalytics, recordSubscriptionAccess,
} from '@/services/subscription-analytics';
import { LogType, SUBSCRIPTION_REQUEST_LOG_MESSAGE } from '@/types/log';

const createLogs = `CREATE TABLE logs (
  id TEXT PRIMARY KEY, level TEXT NOT NULL, type TEXT NOT NULL, message TEXT NOT NULL,
  user_id TEXT, request_id TEXT, meta TEXT, created_at TEXT NOT NULL
)`;

test('legacy migration survives reopening and deleting logs, preserving city and heartbeat history', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'subscription-analytics-'));
  const url = `file:${join(directory, 'test.db')}`;
  let client = createClient({ url });
  try {
    await client.execute(createLogs);
    let db = drizzle(client, { schema });
    const now = new Date();
    const headers = {
      'x-real-ip': '203.0.113.10', 'x-vercel-ip-city': 'Hong%20Kong',
      'x-vercel-ip-country': 'CN', 'user-agent': 'ClashMetaForAndroid/2',
      authorization: 'Bearer must-not-copy', cookie: 'must-not-copy',
    };
    await db.insert(schema.logs).values([0, 30, 60, 31 * 1440].map((minutes, index) => ({
      id: `request-${index}`, level: 'info', type: LogType.SUBSCRIPTION_ACCESS,
      message: SUBSCRIPTION_REQUEST_LOG_MESSAGE, userId: 'demo',
      createdAt: new Date(now.getTime() - minutes * 60_000).toISOString(),
      meta: { headers, url: 'https://example.com/secret-token', body: 'must-not-copy' },
    })));
    await Promise.all([ensureSubscriptionAnalytics(db), ensureSubscriptionAnalytics(db)]);
    expect((await client.execute('SELECT * FROM subscription_access')).rows).toHaveLength(3);
    client.close();
    client = createClient({ url });
    db = drizzle(client, { schema });
    await ensureSubscriptionAnalytics(db);
    expect((await client.execute('SELECT * FROM subscription_access')).rows).toHaveLength(3);
    await client.execute('DELETE FROM logs');
    const result = await getSubscriptionAnalytics(db, { now, rangeDays: 30 });
    expect(result.users[0].ips[0]).toMatchObject({
      ip: '203.0.113.10', requestCount: 3, medianIntervalMinutes: 30,
      location: { city: 'Hong Kong', country: 'CN' }, clientName: 'Clash Meta Android',
    });
    const stored = JSON.stringify((await client.execute('SELECT * FROM subscription_access')).rows);
    expect(stored).not.toContain('must-not-copy');
    expect(stored).not.toContain('secret-token');
    expect(result.trend.points.reduce((sum, point) => sum + point.requests, 0)).toBe(3);
  } finally {
    client.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('independent access writes whitelist headers and cleanup retains all recent records', async () => {
  const client = createClient({ url: 'file::memory:' });
  try {
    await client.execute(createLogs);
    const db = drizzle(client, { schema });
    await recordSubscriptionAccess(db, new Request('https://example.com/private-token', {
      headers: {
        'cf-connecting-ip': '2001:db8::1', 'x-vercel-ip-city': '%E4%B8%8A%E6%B5%B7',
        'user-agent': 'Mihomo/1', authorization: 'Bearer secret', cookie: 'secret',
      },
    }), 'demo');
    await client.execute({
      sql: 'INSERT INTO subscription_access VALUES (?, ?, ?, ?)',
      args: ['expired', 'demo', '{}', new Date(Date.now() - 31 * 86400000).toISOString()],
    });
    await cleanupSubscriptionAnalytics(db);
    const rows = (await client.execute('SELECT * FROM subscription_access')).rows;
    expect(rows).toHaveLength(1);
    expect(JSON.parse(String(rows[0].headers))).toEqual({
      'cf-connecting-ip': '2001:db8::1', 'x-vercel-ip-city': '%E4%B8%8A%E6%B5%B7', 'user-agent': 'Mihomo/1',
    });
    const result = await getSubscriptionAnalytics(db, { rangeDays: 1 });
    expect(result.users[0].ips[0]).toMatchObject({
      ip: '2001:db8::1', location: { city: '上海' }, clientName: 'Mihomo', requestCount: 1,
    });
    expect((await client.execute('SELECT * FROM logs')).rows).toHaveLength(0);
  } finally {
    client.close();
  }
});

test('failed legacy copy rolls back its marker and retries successfully', async () => {
  const client = createClient({ url: 'file::memory:' });
  try {
    await client.execute(createLogs);
    const db = drizzle(client, { schema });
    await db.insert(schema.logs).values({
      id: 'request', level: 'info', type: LogType.SUBSCRIPTION_ACCESS,
      message: SUBSCRIPTION_REQUEST_LOG_MESSAGE, userId: 'demo',
      meta: { headers: { 'x-real-ip': '203.0.113.1' } }, createdAt: new Date().toISOString(),
    });
    await client.execute('CREATE TABLE subscription_access (id TEXT PRIMARY KEY, user_id TEXT, headers TEXT NOT NULL, created_at TEXT NOT NULL)');
    await client.execute(`CREATE TRIGGER fail_migration BEFORE INSERT ON subscription_access
      BEGIN SELECT RAISE(ABORT, 'test migration failure'); END`);
    await expect(ensureSubscriptionAnalytics(db)).rejects.toThrow('test migration failure');
    expect((await client.execute("SELECT name FROM sqlite_master WHERE name = 'subscription_analytics_migrations'")).rows).toHaveLength(0);
    await client.execute('DROP TRIGGER fail_migration');
    await ensureSubscriptionAnalytics(db);
    expect((await client.execute('SELECT * FROM subscription_access')).rows).toHaveLength(1);
    expect((await client.execute('SELECT * FROM subscription_analytics_migrations')).rows).toHaveLength(1);
  } finally {
    client.close();
  }
});
