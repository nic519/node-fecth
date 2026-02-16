import { z } from 'zod';

// =============================================================================
// 基础 Schemas
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
	requiredFilters: z.string().optional(),
	fileName: z.string().optional(),
	multiPortMode: z.array(AreaCodeSchema).optional(),
	appendSubList: z.array(SubConfigSchema).optional(),
	excludeRegex: z.string().optional(),
	ruleOverwrite: z.string().optional(),
});

/**
 * 存储在数据库中的用户配置 Schema
 * 移除了已经作为独立字段存储的配置项
 */
export const StoredUserConfigSchema = UserConfigSchema.omit({
	accessToken: true,
	requiredFilters: true,
	ruleUrl: true,
	fileName: true,
	appendSubList: true,
	ruleOverwrite: true,
});

// 配置响应 Schema（扁平化结构）
export const ConfigResponseSchema = UserConfigSchema.extend({
	updatedAt: z.string(),
});

export const SubscribeParamsSchema = z.object({
	download: z.string().optional(),
	flag: z.string().optional(),
	filename: z.string().optional(),
});


// =============================================================================
// 请求参数 Schemas
// =============================================================================

// 用户 Token 验证参数
export const ScUserTokenParams = z.object({
	uid: z.string().describe('用户唯一标识符'),
	token: z.string().describe('用户访问令牌'),
});

// 超级管理员 Token 验证参数
export const ScSuperAdminTokenParams = z.object({
	superToken: z.string().describe('超级管理员访问令牌'),
});

// 用户 ID 路径参数
export const ScUserIdParams = z.object({
	uid: z.string().describe('用户ID'),
});

// 用户 Token 查询参数（单独的 token）
export const ScUserQueryToken = z.object({
	token: z.string().describe('用户访问令牌'),
});

// =============================================================================
// 请求体 Schemas
// =============================================================================


// 更新用户配置请求 Schema（用户自己使用）
export const ScUserUpdateReq = z.object({
	config: UserConfigSchema,
});

// =============================================================================
// 响应 Schemas
// =============================================================================

// 基础响应 Schema
export const ScBaseResponse = z.object({
	code: z.number().default(0),
	msg: z.string(),
});

// 用户详情响应 Schema（普通用户获取自己的配置）
export const ScUserDetailResponse = ScBaseResponse.extend({
	data: z.object({
		config: UserConfigSchema
	}),
});

// 用户更新响应 Schema
export const ScUserUpdateResponse = ScBaseResponse.extend({
	data: z.object({
		uid: z.string(),
		timestamp: z.string(),
		message: z.string(),
	}),
});

// 管理员获取用户列表响应 Schema
export const ScUserListResponse = ScBaseResponse.extend({
	data: z.object({
		users: z.array(UserConfigSchema),
	}),
});

// 管理员获取单个用户响应 Schema
export const ScUserGetResponse = ScBaseResponse.extend({
	data: UserConfigSchema,
});

// 管理员创建用户响应 Schema
export const ScUserCreateResponse = ScBaseResponse.extend({
	data: UserConfigSchema,
});

// 管理员更新用户响应 Schema
export const ScUserAdminUpdateResponse = ScBaseResponse.extend({
	data: UserConfigSchema,
});

// 管理员删除用户响应 Schema
export const ScUserDeleteResponse = ScBaseResponse.extend({
	data: z.object({
		uid: z.string(),
	}),
});

// =============================================================================
// 导出 TypeScript 类型
// =============================================================================

// 数据模型类型 
export type IUserConfig = z.infer<typeof UserConfigSchema>;
export type IStoredUserConfig = z.infer<typeof StoredUserConfigSchema>;


// 请求参数类型
export type IScUserTokenParams = z.infer<typeof ScUserTokenParams>;
export type IScSuperAdminTokenParams = z.infer<typeof ScSuperAdminTokenParams>;
export type IScUserIdParams = z.infer<typeof ScUserIdParams>;
export type IScUserQueryToken = z.infer<typeof ScUserQueryToken>;

// 请求体类型 
export type IScUserUpdateReq = z.infer<typeof ScUserUpdateReq>;
export type IConfigResponse = z.infer<typeof ConfigResponseSchema>;

// 响应类型
export type IScUserDetailResponse = z.infer<typeof ScUserDetailResponse>;
export type IScUserUpdateResponse = z.infer<typeof ScUserUpdateResponse>;
export type IScUserListResponse = z.infer<typeof ScUserListResponse>;
export type IScUserGetResponse = z.infer<typeof ScUserGetResponse>;
export type IScUserCreateResponse = z.infer<typeof ScUserCreateResponse>;
export type IScUserAdminUpdateResponse = z.infer<typeof ScUserAdminUpdateResponse>;
export type IScUserDeleteResponse = z.infer<typeof ScUserDeleteResponse>;
