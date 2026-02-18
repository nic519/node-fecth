/* eslint-disable @typescript-eslint/no-explicit-any */
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function getRuntimeEnv(env?: Env): Env | undefined {
  if (env) return env;
  const context = (globalThis as any)[Symbol.for('__cloudflare-context__')];
  return context?.env;
}

export function getDb(envOrNull?: any) {
  // 1. Development Environment (Local)
  // 使用 better-sqlite3 读取本地 .wrangler 状态文件
  if (process.env.NODE_ENV === 'development') {
    try {
      // 动态 require 避免被打包到 Edge Worker
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { drizzle: drizzleBetterSqlite3 } = require('drizzle-orm/better-sqlite3');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Database = require('better-sqlite3');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');

      // 本地数据库路径 (根据你的项目实际路径配置)
      const dbPath = path.resolve(process.cwd(), '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/4177397522330b0ecc63f8d05c202d6aa6790575b55e4ab4250a5029b2fd1b10.sqlite');

      return drizzleBetterSqlite3(new Database(dbPath), { schema });
    } catch (e) {
      console.warn('Failed to initialize local DB:', e);
      return drizzle({} as any, { schema });
    }
  }

  // 2. Production Environment (Cloudflare Worker/Pages)
  // 尝试获取 D1 绑定 (DB)

  // A. 优先使用显式传入的 env
  let dbBinding = envOrNull?.DB;

  // B. 尝试从 OpenNext 全局上下文获取
  if (!dbBinding) {
    const context = (globalThis as any)[Symbol.for('__cloudflare-context__')];
    dbBinding = context?.env?.DB;

    // Debug: 如果在运行时找不到 DB，打印可用变量帮助排查
    if (!dbBinding && context?.env) {
      console.log('Available bindings in context:', Object.keys(context.env));
    }
  }

  // C. 如果成功获取到绑定，返回 Drizzle 实例
  if (dbBinding) {
    return drizzle(dbBinding, { schema });
  }

  // D. 兜底逻辑 (Build Time 或 配置错误)
  // 在 next build 期间可能没有绑定，返回空实例避免构建失败
  // 在运行时如果走到这里，后续查询会报错
  console.warn('WARN: D1 binding "DB" not found. This is normal during build, but fatal at runtime.');
  return drizzle({} as any, { schema });
}

export type DbInstance = ReturnType<typeof getDb>;
export * from './schema';
export { BaseCRUD } from './base-crud';

