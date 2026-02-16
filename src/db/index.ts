/* eslint-disable @typescript-eslint/no-explicit-any */
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

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

  // Fallback or error
  console.warn("DB binding not found, verify context");
  return drizzle(env?.DB || {}, { schema });
}

export type DbInstance = ReturnType<typeof getDb>;
export * from './schema';
export { BaseCRUD } from './base-crud';
export { createCRUDHandlers, type CRUDConfig, type CRUDHandlers, type CRUDMessages } from './crud-api-factory';
export { getBaseUrl, withRecord, withRecordAndMessage } from './crud-helpers';
