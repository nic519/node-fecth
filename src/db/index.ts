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
export * from './schema';
export { schema };

// 导出 CRUD 工具
export { BaseCRUD } from './base-crud';
export { createCRUDHandlers, type CRUDConfig, type CRUDHandlers, type CRUDMessages } from './crud-api-factory';
export { getBaseUrl, withRecord, withRecordAndMessage } from './crud-helpers';
