import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * 获取数据库实例
 * @param env Cloudflare Workers 环境变量
 */
export function getDb(env: Env) {
	return drizzle(env.DB, { schema });
}

export type DbInstance = ReturnType<typeof getDb>;

// 导出 schema 以便其他地方使用
export { schema };
export * from './schema';

