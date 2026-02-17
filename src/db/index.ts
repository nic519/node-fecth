/* eslint-disable @typescript-eslint/no-explicit-any */
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// 动态判断是否在 Edge Runtime 环境
const isEdge = process.env.NEXT_RUNTIME === 'edge' || typeof window === 'undefined' && typeof process === 'object' && process.env.NODE_ENV !== 'test' && !process.versions?.node;

export function getDb(env?: any) {
  // 1. 如果显式传了 env.DB (Cloudflare Worker/Pages 原生环境)，直接用
  if (env && env.DB) {
    return drizzle(env.DB, { schema });
  }

  // 2. 尝试从 process.env 获取 (OpenNext / Next.js)
  const processEnv = process.env as any;
  if (processEnv && processEnv.DB) {
    return drizzle(processEnv.DB, { schema });
  }

  // 3. 本地开发环境的回退逻辑 (使用 better-sqlite3 读取本地 D1 文件)
  // 只有在非 Edge 环境且是开发模式下才执行，避免 Edge Runtime 报错
  if (process.env.NODE_ENV === 'development' && !isEdge) {
    try {
      // 动态 require，避免构建工具打包进 Edge Bundle
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { drizzle: drizzleBetterSqlite3 } = require('drizzle-orm/better-sqlite3');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Database = require('better-sqlite3');

      // 定位本地 D1 数据库文件
      // 注意：如果重置了 wrangler 环境，这个哈希值可能会变
      const dbPath = path.resolve(process.cwd(), '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/4177397522330b0ecc63f8d05c202d6aa6790575b55e4ab4250a5029b2fd1b10.sqlite');

      const sqlite = new Database(dbPath);
      return drizzleBetterSqlite3(sqlite, { schema });
    } catch (e: any) {
      // 忽略 Edge Runtime 不支持 fs/path 的错误
      if (e.code !== 'MODULE_NOT_FOUND' && !e.message?.includes('edge runtime')) {
          console.warn("Failed to initialize local better-sqlite3 database:", e);
      }
    }
  }

  // 4. 如果都失败了，且在 Cloudflare 环境下，可能是绑定没生效
  // 返回一个空的 drizzle 实例或者抛错
  // 注意：在构建时(build time)可能会走到这里，所以不要直接 throw
  console.warn("DB binding not found, verify context");
  return drizzle(env?.DB || {}, { schema });
}

export type DbInstance = ReturnType<typeof getDb>;
export * from './schema';
export { BaseCRUD } from './base-crud';
