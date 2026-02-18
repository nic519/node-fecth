import { z } from 'zod';
import { AREA_CODES } from '@/config/proxy-area.config';

// =============================================================================
// 基础 Schemas
// =============================================================================

// 地区代码 Schema
export const AreaCodeSchema = z.enum(AREA_CODES);

// 子订阅配置 Schema
export const SubscribeSchema = z.object({
	subscribe: z.url('订阅链接必须是有效的URL'),
	flag: z.string().min(1, '标识不能为空'),
	includeArea: z.array(AreaCodeSchema).optional(),
});

// 用户配置 Schema
export const UserConfigSchema = z.object({
	subscribe: z.url('订阅链接必须是有效的URL'),
	accessToken: z.string().min(1, '访问令牌不能为空'),
	ruleUrl: z.union([z.string().url(), z.literal('')]).optional(),
	requiredFilters: z.string().optional(),
	fileName: z.string().optional(),
	multiPortMode: z.array(AreaCodeSchema).optional(),
	appendSubList: z.array(SubscribeSchema).optional(),
	excludeRegex: z.string().optional(),
	ruleOverwrite: z.string().optional(),
	updatedAt: z.string().datetime().optional(),
});

/**
 * 存储在数据库中的动态Config配置 Schema
 * 移除了已经作为独立字段存储的配置项
 */
export const DynamicUserConfigSchema = UserConfigSchema.omit({
	accessToken: true,
	requiredFilters: true,
	ruleUrl: true,
	fileName: true,
	appendSubList: true,
	ruleOverwrite: true,
});


export const SubscribeParamsSchema = z.object({
	download: z.string().optional(),
	flag: z.string().optional(),
	filename: z.string().optional(),
});


// =============================================================================
// 请求体 Schemas
// =============================================================================


// 更新用户配置请求 Schema（用户自己使用）
export const ScUserUpdateReq = z.object({
	config: UserConfigSchema,
});

// =============================================================================
// 导出 TypeScript 类型
// =============================================================================

// 数据模型类型 
export type IUserConfig = z.infer<typeof UserConfigSchema>;


// 流量信息 Schema
export const TrafficInfoSchema = z.object({
	upload: z.number(),
	download: z.number(),
	total: z.number(),
	used: z.number(),
	remaining: z.number(),
	expire: z.number().optional(),
	isExpired: z.boolean(),
	usagePercent: z.number(),
});

export type TrafficInfo = z.infer<typeof TrafficInfoSchema>;

