/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

export function getRuntimeEnv(env?: Env): Env | undefined {
  if (env) return env;
  const context = (globalThis as any)[Symbol.for('__cloudflare-context__')];
  return context?.env;
}

function getEnvVar(key: string, envOrNull?: any): string | undefined {
  // 1. Try passed env
  if (envOrNull && envOrNull[key]) return envOrNull[key];

  // 2. Try global context
  const context = (globalThis as any)[Symbol.for('__cloudflare-context__')];
  if (context?.env?.[key]) return context.env[key];

  // 3. Try process.env
  if (process.env[key]) return process.env[key];

  return undefined;
}

export function getDb(envOrNull?: any) {
  const url = getEnvVar('TURSO_DATABASE_URL', envOrNull);
  const authToken = getEnvVar('TURSO_AUTH_TOKEN', envOrNull);

  if (!url) {
    console.warn('WARN: TURSO_DATABASE_URL not found. Database operations will fail.');
    // Return a dummy client to avoid crash during build
    const dummyClient = createClient({ url: 'file::memory:' });
    return drizzle(dummyClient, { schema });
  }

  const client = createClient({
    url,
    authToken,
  });

  return drizzle(client, { schema });
}

export type DbInstance = ReturnType<typeof getDb>;
export * from './schema';
export { BaseCRUD } from './base-crud';
