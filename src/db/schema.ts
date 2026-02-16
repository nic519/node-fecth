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

/**
 * 用户配置表
 * 存储用户的订阅配置和访问令牌等信息
 */
export const users = sqliteTable('users', {
	// 主键：用户ID
	id: text('id').primaryKey(),

	// 用户配置（JSON格式）
	config: text('config').notNull(), // 存储 JSON 字符串

	// 访问令牌（从 config 中提取，用于快速查询）
	accessToken: text('access_token').notNull(),

	// 需要的过滤项
	// 根据ruleUrl的proxy-groups得出，如 [单]-Facebook👥, [单]-LinkedIn👥, 用逗号隔开
	// 默认为空，代表不进行过滤
	requiredFilters: text('required_filters').default(''),

	// 规则URL， clash格式的过滤表
	// 如果为空，默认为：https://raw.githubusercontent.com/zzy333444/passwall_rule/refs/heads/main/miho-cfg.yaml
	ruleUrl: text('rule_url').default(''),

	// 文件名，默认值为：miho-cfg.yaml
	fileName: text('file_name').notNull().default('miho-cfg.yaml'),

	// 追加的子配置列表	
	// 格式为 JSON 字符串，存储需要追加的子配置项
	appendSubList: text('append_sub_list').default(''),

	// 时间戳
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`),
});


export const dynamic = sqliteTable('dynamic', {
	id: text('id').primaryKey(),            // url 的 md5
	url: text('url').notNull(),             // 订阅地址
	content: text('content').notNull(),     // 订阅内容
	traffic: text('traffic'),               // 流量剩余情况
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
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
