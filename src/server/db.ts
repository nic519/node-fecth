import 'server-only';

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

import * as schema from '@/db/schema';
import { getRuntimeValue, resolveRuntimeEnv } from '@/server/runtime';

export function getServerDb(explicitEnv?: Env) {
  const runtimeEnv = resolveRuntimeEnv(explicitEnv);
  const url = getRuntimeValue('TURSO_DATABASE_URL', runtimeEnv);
  const authToken = getRuntimeValue('TURSO_AUTH_TOKEN', runtimeEnv);

  if (!url) {
    console.warn('WARN: TURSO_DATABASE_URL not found. Database operations will fail.');
    const dummyClient = createClient({ url: 'file::memory:' });
    return drizzle(dummyClient, { schema });
  }

  const client = createClient({
    url,
    authToken,
  });

  return drizzle(client, { schema });
}

export type DbInstance = ReturnType<typeof getServerDb>;
