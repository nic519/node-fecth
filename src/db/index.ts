/* eslint-disable @typescript-eslint/no-explicit-any */
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import path from 'path';

export function getDb(env?: any) {
  // If env is passed explicitly (legacy), use it
  if (env && env.DB) {
    return drizzle(env.DB, { schema });
  }

  // Otherwise try to get from process.env (OpenNext)
  const processEnv = process.env as any;
  if (processEnv && processEnv.DB) {
    return drizzle(processEnv.DB, { schema });
  }

  // Fallback for local development using better-sqlite3
  if (process.env.NODE_ENV === 'development') {
    try {
      const { drizzle: drizzleBetterSqlite3 } = require('drizzle-orm/better-sqlite3');
      const Database = require('better-sqlite3');

      // Locate the local D1 database file
      // Note: This path might change if you reset your local environment
      // You can find this path by checking .wrangler/state/v3/d1/miniflare-D1DatabaseObject/
      const dbPath = path.resolve(process.cwd(), '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/4177397522330b0ecc63f8d05c202d6aa6790575b55e4ab4250a5029b2fd1b10.sqlite');

      const sqlite = new Database(dbPath);
      return drizzleBetterSqlite3(sqlite, { schema });
    } catch (e) {
      console.warn("Failed to initialize local better-sqlite3 database:", e);
    }
  }

  // Fallback or error
  console.warn("DB binding not found, verify context");
  return drizzle(env?.DB || {}, { schema });
}

export type DbInstance = ReturnType<typeof getDb>;
export * from './schema';
export { BaseCRUD } from './base-crud';
export { createCRUDHandlers, type CRUDConfig, type CRUDHandlers, type CRUDMessages } from './crud-api-factory';
export { getBaseUrl, withRecord, withRecordAndMessage } from './crud-helpers';
