import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import { getRequestContext } from '@cloudflare/next-on-pages';

export function getDb(env?: any) {
  // If env is passed explicitly (legacy), use it
  if (env && env.DB) {
    return drizzle(env.DB, { schema });
  }

  // Otherwise try to get from request context
  try {
    const context = getRequestContext();
    // Force cast to any to bypass strict type checks during migration
    const contextEnv = context.env as any;
    
    if (contextEnv && contextEnv.DB) {
      return drizzle(contextEnv.DB, { schema });
    }
  } catch (e) {
    // Ignore error if not in request context
  }
  
  // Fallback or error
  console.warn("DB binding not found, verify context");
  // @ts-ignore
  return drizzle(env?.DB || {}, { schema });
}

export type DbInstance = ReturnType<typeof getDb>;
export * from './schema';
export { BaseCRUD } from './base-crud';
export { createCRUDHandlers, type CRUDConfig, type CRUDHandlers, type CRUDMessages } from './crud-api-factory';
export { getBaseUrl, withRecord, withRecordAndMessage } from './crud-helpers';
