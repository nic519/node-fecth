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
});

// 配置响应 Schema（兼容旧接口）
export const ConfigResponseSchema = z.object({
	config: UserConfigSchema,
	assetToken: z.string(),
	updatedAt: z.string(),
});

export const SubscribeParamsSchema = z.object({
	download: z.string().optional(),
	flag: z.string().optional(),
	filename: z.string().optional(),
});

// =============================================================================
// 数据库模型 Schemas
// =============================================================================

// 用户模型 Schema（数据库记录 - config 为 JSON 字符串）
export const ScUserDbModel = z.object({
	id: z.string(), // 用户ID
	config: z.string(), // JSON 字符串格式的配置
	accessToken: z.string(), // 访问令牌
	createdAt: z.string(), // 创建时间
	updatedAt: z.string(), // 更新时间
});

// 用户模型 Schema（API 返回 - config 已解析为对象）
export const ScUserApiModel = z.object({
	id: z.string(), // 用户ID
	config: UserConfigSchema, // 解析后的配置对象
	accessToken: z.string(), // 访问令牌
	createdAt: z.string(), // 创建时间
	updatedAt: z.string(), // 更新时间
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

// 创建用户请求 Schema
export const ScUserCreateReq = z.object({
	uid: z.string().min(1, '用户ID不能为空'),
	config: UserConfigSchema,
});

// 更新用户配置请求 Schema（用户自己使用）
export const ScUserUpdateReq = z.object({
	config: UserConfigSchema,
});

// 管理员更新用户配置请求 Schema（不需要 uid，从路径参数获取）
export const ScUserAdminUpdateReq = z.object({
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
		users: z.array(ScUserApiModel),
	}),
});

// 管理员获取单个用户响应 Schema
export const ScUserGetResponse = ScBaseResponse.extend({
	data: ScUserApiModel,
});

// 管理员创建用户响应 Schema
export const ScUserCreateResponse = ScBaseResponse.extend({
	data: ScUserApiModel,
});

// 管理员更新用户响应 Schema
export const ScUserAdminUpdateResponse = ScBaseResponse.extend({
	data: ScUserApiModel,
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
export type IScUserDbModel = z.infer<typeof ScUserDbModel>;
export type IScUserApiModel = z.infer<typeof ScUserApiModel>;
export type IUserConfig = z.infer<typeof UserConfigSchema>;


// 请求参数类型
export type IScUserTokenParams = z.infer<typeof ScUserTokenParams>;
export type IScSuperAdminTokenParams = z.infer<typeof ScSuperAdminTokenParams>;
export type IScUserIdParams = z.infer<typeof ScUserIdParams>;
export type IScUserQueryToken = z.infer<typeof ScUserQueryToken>;

// 请求体类型
export type IScUserCreateReq = z.infer<typeof ScUserCreateReq>;
export type IScUserUpdateReq = z.infer<typeof ScUserUpdateReq>;
export type IScUserAdminUpdateReq = z.infer<typeof ScUserAdminUpdateReq>;

// 响应类型
export type IScUserDetailResponse = z.infer<typeof ScUserDetailResponse>;
export type IScUserUpdateResponse = z.infer<typeof ScUserUpdateResponse>;
export type IScUserListResponse = z.infer<typeof ScUserListResponse>;
export type IScUserGetResponse = z.infer<typeof ScUserGetResponse>;
export type IScUserCreateResponse = z.infer<typeof ScUserCreateResponse>;
export type IScUserAdminUpdateResponse = z.infer<typeof ScUserAdminUpdateResponse>;
export type IScUserDeleteResponse = z.infer<typeof ScUserDeleteResponse>;
