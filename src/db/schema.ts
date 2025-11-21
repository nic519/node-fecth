import { sql } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * 配置模板表
 * 存储 Clash/V2ray 等配置模板
 */
export const templates = sqliteTable('templates', {
	// 主键：使用字符串类型的时间戳作为ID
	id: text('id').primaryKey(),

	// 基本信息
	name: text('name').notNull(),
	description: text('description').notNull(),

	// 模板内容（YAML 配置）
	content: text('content').notNull(),

	// 时间戳
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`),
});

/**
 * 类型导出：用于 TypeScript 类型推导
 */
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
