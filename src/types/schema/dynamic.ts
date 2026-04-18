import { z } from 'zod';

/**
 * 动态摘要 Schema
 * 用于描述动态获取的订阅信息摘要
 */
export const DynamicSummarySchema = z.object({
	/**
	 * 唯一标识，通常为 URL 的哈希值
	 */
	id: z.string(),
	/**
	 * 订阅源 URL
	 */
	url: z.string().url(),
	/**
	 * 流量信息字符串
	 * 如 "upload=1024;download=2048;total=4096;expire=123456789"
	 */
	traffic: z.string().nullable(),
	/**
	 * 最后更新时间 (ISO 8601)
	 */
	updatedAt: z.string(),
});

/**
 * 动态摘要类型
 * 从 DynamicSummarySchema 推导出的 TypeScript 类型
 */
export type DynamicSummary = z.infer<typeof DynamicSummarySchema>;

/**
 * 动态同步请求 Schema
 * 用于触发单个 URL 的即时同步
 */
export const DynamicSyncRequestSchema = z.object({
	/**
	 * 需要同步的订阅源 URL
	 */
	url: z.string().url(),
});

/**
 * 动态同步请求类型
 * 从 DynamicSyncRequestSchema 推导出的 TypeScript 类型
 */
export type DynamicSyncRequest = z.infer<typeof DynamicSyncRequestSchema>;

/**
 * 动态缓存请求 Schema
 * 用于批量获取 URL 的缓存信息
 */
export const DynamicCacheRequestSchema = z.object({
	/**
	 * 需要查询缓存的 URL 列表
	 */
	urls: z.array(z.string().url()).min(1),
});

/**
 * 动态缓存请求类型
 * 从 DynamicCacheRequestSchema 推导出的 TypeScript 类型
 */
export type DynamicCacheRequest = z.infer<typeof DynamicCacheRequestSchema>;
