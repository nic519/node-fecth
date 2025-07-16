import { z } from 'zod';

// =============================================================================
// 基础 Schemas - 作为单一真理源(Single Source of Truth)
// =============================================================================

// 地区代码 Schema
export const AreaCodeSchema = z.enum(['TW', 'SG', 'JP', 'VN', 'HK', 'US']);

// 订阅配置 Schema
export const SubConfigSchema = z.object({
	subscribe: z.string().url('订阅链接必须是有效的URL'),
	flag: z.string().min(1, '标识不能为空'),
	includeArea: z.array(AreaCodeSchema).optional(),
});

// 用户配置 Schema
export const UserConfigSchema = z.object({
	subscribe: z.string().url('订阅链接必须是有效的URL'),
	accessToken: z.string().min(1, '访问令牌不能为空'),
	ruleUrl: z.string().url().optional(),
	fileName: z.string().optional(),
	multiPortMode: z.array(AreaCodeSchema).optional(),
	appendSubList: z.array(SubConfigSchema).optional(),
	excludeRegex: z.string().optional(),
});

// 配置元数据 Schema
export const UserConfigMetaSchema = z.object({
	lastModified: z.string(),
	source: z.enum(['kv', 'env']),
	uid: z.string(),
});

// 配置响应 Schema
export const ConfigResponseSchema = z.object({
	config: UserConfigSchema,
	meta: UserConfigMetaSchema,
});

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
	source: z.enum(['kv', 'env', 'none']),
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

// 配置模板 Schema
export const ConfigTemplateSchema = z.object({
	id: z.union([z.number(), z.string()]), // 支持数字或字符串ID
	name: z.string(),
	description: z.string(),
	type: z.enum(['clash', 'v2ray', 'shadowsocks']),
	lastModified: z.string(),
	isActive: z.boolean(),
	usageCount: z.number(),
	version: z.string(),
	content: z.string().optional(),
	template: UserConfigSchema.optional(), // 用于后端模板应用
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
	isDefault: z.boolean().optional(),
});

// =============================================================================
// 响应 Schemas
// =============================================================================

// 错误响应 Schema
export const ErrorResponseSchema = z.object({
	error: z.string(),
	message: z.string().optional(),
	code: z.number().optional(),
});

// 成功响应 Schema
export const SuccessResponseSchema = z.object({
	success: z.boolean(),
	message: z.string().optional(),
	data: z.any().optional(),
});

// 用户列表响应 Schema
export const UsersListResponseSchema = z.object({
	users: z.array(UserSummarySchema),
	count: z.number(),
	timestamp: z.string(),
});

// =============================================================================
// 请求参数 Schemas
// =============================================================================

export const UserIdParamSchema = z.object({
	uid: z.string().min(1, '用户ID不能为空'),
});

export const TokenQuerySchema = z.object({
	token: z.string().min(1, '令牌不能为空'),
});

export const SuperTokenQuerySchema = z.object({
	superToken: z.string().min(1, '超级管理员令牌不能为空'),
});

export const SubscribeParamsSchema = z.object({
	download: z.string().optional(),
	flag: z.string().optional(),
	filename: z.string().optional(),
});

// 创建用户请求 Schema
export const CreateUserRequestSchema = z.object({
	uid: z.string().min(1, '用户ID不能为空'),
	config: UserConfigSchema,
});

// 更新用户配置请求 Schema
export const UpdateUserConfigRequestSchema = z
	.object({
		config: UserConfigSchema.optional(),
		yaml: z.string().optional(),
	})
	.refine((data) => data.config || data.yaml, {
		message: '必须提供 config 或 yaml 数据',
	});

// 创建配置模板请求 Schema
export const CreateConfigTemplateRequestSchema = z.object({
	name: z.string().min(1, '模板名称不能为空'),
	description: z.string(),
	type: z.enum(['clash', 'v2ray', 'shadowsocks']),
	content: z.string().min(1, '模板内容不能为空'),
});

// =============================================================================
// 导出所有TypeScript类型 - 作为单一真理源
// =============================================================================

export type AreaCode = z.infer<typeof AreaCodeSchema>;
export type SubConfig = z.infer<typeof SubConfigSchema>;
export type UserConfig = z.infer<typeof UserConfigSchema>;
export type UserConfigMeta = z.infer<typeof UserConfigMetaSchema>;
export type ConfigResponse = z.infer<typeof ConfigResponseSchema>;
export type TrafficInfo = z.infer<typeof TrafficInfoSchema>;
export type UserSummary = z.infer<typeof UserSummarySchema>;
export type AdminStats = z.infer<typeof AdminStatsSchema>;
export type SystemStats = z.infer<typeof SystemStatsSchema>;
export type SystemInfo = z.infer<typeof SystemInfoSchema>;
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;
export type SystemLog = z.infer<typeof SystemLogSchema>;
export type ConfigTemplate = z.infer<typeof ConfigTemplateSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type UsersListResponse = z.infer<typeof UsersListResponseSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UpdateUserConfigRequest = z.infer<typeof UpdateUserConfigRequestSchema>;
export type CreateConfigTemplateRequest = z.infer<typeof CreateConfigTemplateRequestSchema>;

// =============================================================================
// 便捷的别名导出（向后兼容）
// =============================================================================

export type ApiError = ErrorResponse;
