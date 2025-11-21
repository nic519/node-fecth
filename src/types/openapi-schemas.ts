import { z } from 'zod';
// 从用户模块导入用户相关 Schema
import {
	AreaCodeSchema,
	ConfigResponseSchema,
	SubConfigSchema,
	UserConfigMetaSchema,
	UserConfigSchema,
} from '@/routes/modules/user/schema.user';

// =============================================================================
// 基础 Schemas - 作为单一真理源(Single Source of Truth)
// =============================================================================

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

// 用户摘要 Schema
export const UserSummarySchema = z.object({
	uid: z.string(),
	token: z.string(),
	hasConfig: z.boolean(),
	source: z.enum(['kv', 'env', 'd1', 'none']), // 添加 'd1' 支持
	lastModified: z.string().nullable(),
	isActive: z.boolean(),
	subscribeUrl: z.string().optional(),
	status: z.enum(['active', 'inactive', 'disabled']),
	trafficInfo: TrafficInfoSchema.optional(),
});

// 管理员统计 Schema
export const AdminStatsSchema = z.object({
	totalUsers: z.number(),
	activeUsers: z.number(),
	todayRequests: z.number(),
	systemStatus: z.string(),
	totalTraffic: z.string(),
	todayTraffic: z.string(),
	serverNodes: z.number(),
	uptime: z.string(),
});

// 系统统计 Schema - 新增
export const SystemStatsSchema = z.object({
	cpu: z.number(),
	memory: z.number(),
	disk: z.number(),
	network: z.number(),
});

// 系统信息 Schema - 新增
export const SystemInfoSchema = z.object({
	os: z.string(),
	uptime: z.string(),
	totalMemory: z.string(),
	availableMemory: z.string(),
	totalDisk: z.string(),
	availableDisk: z.string(),
});

// 服务状态 Schema - 新增
export const ServiceStatusSchema = z.object({
	name: z.string(),
	status: z.enum(['running', 'stopped', 'error', 'pending']),
	description: z.string().optional(),
});

// 系统日志 Schema - 新增
export const SystemLogSchema = z.object({
	time: z.string(),
	level: z.enum(['INFO', 'WARN', 'ERROR', 'DEBUG']),
	message: z.string(),
});

// =============================================================================
// 响应 Schemas - 统一格式 {code, data, msg}
// =============================================================================

// 响应代码常量
export const ResponseCodes = {
	SUCCESS: 0,
	INVALID_PARAMS: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	FORMAT_ERROR: 422,
	INTERNAL_ERROR: 500,
} as const;

// 注意：用户相关的 Schema 已经迁移到 @/routes/modules/user/schema.user.ts
// 这里保留旧的导入以兼容现有代码

// 用户列表响应 Schema
export const UsersListResponseSchema = z.object({
	code: z.literal(ResponseCodes.SUCCESS),
	msg: z.string(),
	data: z.object({
		users: z.array(UserSummarySchema),
		count: z.number(),
		timestamp: z.string(),
	}),
});

// 管理员统计响应 Schema
export const AdminStatsResponseSchema = z.object({
	code: z.literal(ResponseCodes.SUCCESS),
	msg: z.string(),
	data: AdminStatsSchema,
});

// 配置模板列表响应 Schema
// =============================================================================
// 请求参数 Schemas
// =============================================================================

export const TokenQuerySchema = z.object({
	token: z.string().min(1, '令牌不能为空'),
});

export const SuperTokenQuerySchema = z.object({
	superToken: z.string().min(1, '超级管理员令牌不能为空'),
});

// =============================================================================
// 导出所有TypeScript类型 - 作为单一真理源
// =============================================================================

// 从用户模块导出用户相关类型
export {
	AreaCodeSchema,
	ConfigResponseSchema,
	SubConfigSchema,
	UserConfigMetaSchema,
	UserConfigSchema,
	type IScUserApiModel,
	type IUserConfig as UserConfig,
	type IUserConfigMeta as UserConfigMeta,
} from '@/routes/modules/user/schema.user';

export type AreaCode = z.infer<typeof AreaCodeSchema>;
export type SubConfig = z.infer<typeof SubConfigSchema>;
export type ConfigResponse = z.infer<typeof ConfigResponseSchema>;

export type TrafficInfo = z.infer<typeof TrafficInfoSchema>;
export type UserSummary = z.infer<typeof UserSummarySchema>;
export type AdminStats = z.infer<typeof AdminStatsSchema>;
export type SystemStats = z.infer<typeof SystemStatsSchema>;
export type SystemInfo = z.infer<typeof SystemInfoSchema>;
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;
export type SystemLog = z.infer<typeof SystemLogSchema>;
// 导出响应代码类型
export type ResponseCode = (typeof ResponseCodes)[keyof typeof ResponseCodes];

// 导出响应类型
export type { BaseResponse } from '@/routes/modules/base/schema.base';
export type UsersListResponse = z.infer<typeof UsersListResponseSchema>;
export type AdminStatsResponse = z.infer<typeof AdminStatsResponseSchema>;
export type AdminLogsResponse = z.infer<typeof AdminLogsResponseSchema>;
export type RefreshTrafficResponse = z.infer<typeof RefreshTrafficResponseSchema>;

// =============================================================================
// 管理员API 额外 Schemas
// =============================================================================

// 用户详情 Schema（使用顶部导入的 UserConfigSchema 和 UserConfigMetaSchema）
export const UserDetailsSchema = z.object({
	uid: z.string().describe('用户ID'),
	config: UserConfigSchema.describe('用户配置'),
	meta: UserConfigMetaSchema.describe('配置元数据'),
	trafficInfo: TrafficInfoSchema.optional().describe('流量信息'),
});

// 批量操作请求 Schema
export const BatchOperationRequestSchema = z.object({
	userIds: z.array(z.string()).describe('用户ID列表'),
	operation: z.enum(['delete', 'disable', 'enable']).describe('操作类型'),
});

// 批量操作结果 Schema
export const BatchOperationResultSchema = z.object({
	success: z.number().describe('成功数量'),
	failed: z.number().describe('失败数量'),
	details: z
		.array(
			z.object({
				uid: z.string(),
				success: z.boolean(),
				error: z.string().optional(),
			})
		)
		.describe('详细结果'),
});

// 应用模板请求 Schema
export const ApplyTemplateRequestSchema = z.object({
	uid: z.string().describe('目标用户ID'),
});

// 管理员日志 Schema
export const AdminLogSchema = z.object({
	id: z.string().describe('日志ID'),
	adminId: z.string().describe('管理员ID'),
	action: z.string().describe('操作类型'),
	targetId: z.string().optional().describe('目标对象ID'),
	details: z.string().optional().describe('操作详情'),
	timestamp: z.string().describe('操作时间'),
	ip: z.string().optional().describe('操作IP'),
});

// 操作日志响应 Schema
export const AdminLogsResponseSchema = z.object({
	code: z.literal(ResponseCodes.SUCCESS),
	msg: z.string(),
	data: z.object({
		logs: z.array(AdminLogSchema),
	}),
});

// 刷新用户流量响应 Schema
export const RefreshTrafficResponseSchema = z.object({
	code: z.literal(ResponseCodes.SUCCESS),
	msg: z.string(),
	data: z.object({
		message: z.string(),
		uid: z.string(),
		trafficInfo: TrafficInfoSchema,
	}),
});

// 管理员健康状态 Schema - 重命名避免冲突
export const AdminHealthCheckSchema = z.object({
	status: z.enum(['healthy', 'warning', 'error']).describe('健康状态'),
	timestamp: z.string().describe('检查时间'),
	stats: z
		.object({
			totalUsers: z.number(),
			activeUsers: z.number(),
			configCompleteRate: z.number(),
		})
		.describe('系统统计'),
});
