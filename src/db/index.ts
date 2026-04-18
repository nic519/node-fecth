// Compatibility barrel for legacy imports.
// Prefer importing from `@/server/db` or `@/server/runtime` in new server code.
export { getServerDb as getDb, type DbInstance } from '@/server/db';
export { resolveRuntimeEnv as getRuntimeEnv } from '@/server/runtime';
export * from './schema';
export { BaseCRUD } from './base-crud';
