import { createClient } from '@libsql/client';
import { expect, test } from 'bun:test';
import { drizzle } from 'drizzle-orm/libsql';

import * as schema from '@/db/schema';
import { cleanupRegistrationLimits, ensureRegistrationLimits, releaseRegistration, reserveRegistration } from '@/services/registration-limit';

async function setup() {
  const client = createClient({ url: 'file::memory:' });
  await client.execute('CREATE TABLE logs (type TEXT, meta TEXT, created_at TEXT)');
  return drizzle(client, { schema });
}

test('concurrent attempts reserve an IP only once and log deletion cannot bypass the limit', async () => {
  const db = await setup();
  try {
    const results = await Promise.all(Array.from({ length: 12 }, () => reserveRegistration(db, '203.0.113.1')));
    expect(results.filter(Boolean)).toHaveLength(1);
    await db.$client.execute('DELETE FROM logs');
    expect(await reserveRegistration(db, '203.0.113.1')).toBeNull();
    expect(await reserveRegistration(db, '203.0.113.2')).toBeString();
  } finally {
    db.$client.close();
  }
});

test('failed registration releases only its own reservation, including after an expired reservation is replaced', async () => {
  const db = await setup();
  try {
    const first = await reserveRegistration(db, '203.0.113.1');
    expect(first).toBeString();
    await releaseRegistration(db, '203.0.113.1', first!);
    const second = await reserveRegistration(db, '203.0.113.1');
    expect(second).toBeString();
    await db.$client.execute('UPDATE registration_limits SET expires_at = 0');
    const third = await reserveRegistration(db, '203.0.113.1');
    expect(third).toBeString();
    await releaseRegistration(db, '203.0.113.1', second!);
    expect(await reserveRegistration(db, '203.0.113.1')).toBeNull();
  } finally {
    db.$client.close();
  }
});

test('legacy limits migrate once before logs are deleted and expired limits are cleaned', async () => {
  const db = await setup();
  try {
    await db.$client.execute(`INSERT INTO logs VALUES
      ('public_register', '{"ip":"recent"}', datetime('now', '-1 hour')),
      ('public_register', '{"ip":"recent"}', datetime('now', '-2 hour')),
      ('public_register', '{"ip":"expired"}', datetime('now', '-25 hour')),
      ('public_register', 'invalid', datetime('now'))`);
    await ensureRegistrationLimits(db);
    await db.$client.execute('DELETE FROM logs');
    expect(await reserveRegistration(db, 'recent')).toBeNull();
    expect(await reserveRegistration(db, 'expired')).toBeString();
    await db.$client.execute("UPDATE registration_limits SET expires_at = 0 WHERE ip = 'recent'");
    await cleanupRegistrationLimits(db);
    const rows = await db.$client.execute('SELECT ip FROM registration_limits');
    expect(rows.rows.map(row => row.ip)).toEqual(['expired']);
    await db.$client.execute(`INSERT INTO logs VALUES ('public_register', '{"ip":"later-log"}', datetime('now'))`);
    const freshClient = new Proxy(db.$client, {
      get(target, property) {
        const value = Reflect.get(target, property);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
    await ensureRegistrationLimits(drizzle(freshClient, { schema }));
    expect(await reserveRegistration(db, 'later-log')).toBeString();
  } finally {
    db.$client.close();
  }
});
