import { z } from 'zod';
// 从用户模块导入用户相关 Schema
import {
	AreaCodeSchema,
	SubscribeSchema,
	UserConfigSchema,
} from '@/modules/user/user.schema';

// =============================================================================
// 基础 Schemas - 作为单一真理源(Single Source of Truth)
// =============================================================================

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

// 用户列表响应 Schema
export const UsersListResponseSchema = z.object({
	code: z.literal(ResponseCodes.SUCCESS),
	msg: z.string(),
	data: z.object({
		users: z.array(UserConfigSchema),
		count: z.number(),
		timestamp: z.string(),
	}),
});


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
	SubscribeSchema as SubConfigSchema,
	UserConfigSchema,
	type IUserConfig as UserConfig,
	type TrafficInfo,
} from '@/modules/user/user.schema';

export type AreaCode = z.infer<typeof AreaCodeSchema>;
export type SubConfig = z.infer<typeof SubscribeSchema>;
export type SystemLog = z.infer<typeof SystemLogSchema>;

// 导出响应代码类型
export type ResponseCode = (typeof ResponseCodes)[keyof typeof ResponseCodes];

// 导出响应类型
export type UsersListResponse = z.infer<typeof UsersListResponseSchema>;
