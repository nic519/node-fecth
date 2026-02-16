import { z } from 'zod';
// 从用户模块导入用户相关 Schema
import {
	AreaCodeSchema,
	ConfigResponseSchema,
	SubConfigSchema,
	UserConfigSchema,
} from '@/types/schema.user';

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
	lastModified: z.string().nullable(),
	isActive: z.boolean(),
	subscribeUrl: z.string().optional(),
	status: z.enum(['active', 'inactive', 'disabled']),
	trafficInfo: TrafficInfoSchema.optional(),
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
	UserConfigSchema,
	type IScUserApiModel,
	type IUserConfig as UserConfig,
} from '@/types/schema.user';

export type AreaCode = z.infer<typeof AreaCodeSchema>;
export type SubConfig = z.infer<typeof SubConfigSchema>;
export type ConfigResponse = z.infer<typeof ConfigResponseSchema>;

export type TrafficInfo = z.infer<typeof TrafficInfoSchema>;
export type UserSummary = z.infer<typeof UserSummarySchema>;
export type SystemLog = z.infer<typeof SystemLogSchema>;
// 导出响应代码类型
export type ResponseCode = (typeof ResponseCodes)[keyof typeof ResponseCodes];

// 导出响应类型
export type UsersListResponse = z.infer<typeof UsersListResponseSchema>;
export type AdminLogsResponse = z.infer<typeof AdminLogsResponseSchema>;
export type RefreshTrafficResponse = z.infer<typeof RefreshTrafficResponseSchema>;

// =============================================================================
// 管理员API 额外 Schemas
// =============================================================================

// 用户详情 Schema（使用顶部导入的 UserConfigSchema
export const UserDetailsSchema = z.object({
	uid: z.string().describe('用户ID'),
	config: UserConfigSchema.describe('用户配置'),
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
