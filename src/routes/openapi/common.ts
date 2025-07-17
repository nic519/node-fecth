import { z } from '@hono/zod-openapi';
import { ResponseCodes } from '@/types/openapi-schemas';

// =============================================================================
// 路由路径常量定义
// =============================================================================

export const ROUTE_PATHS = {
	// === OpenAPI 标准路由 ===
	health: '/health',
	// 用户配置路由
	userUpdate: '/config/user/update/{uid}',
	userDetail: '/config/user/detail/{uid}',
	// 管理员路由
	adminUserCreate: '/admin/user/create',
	adminUserDelete: '/admin/user/delete/{uid}',
	allUsers: '/admin/user/all',

	// === 非 OpenAPI 路由（路径常量） ===
	storage: '/storage',
	kv: '/kv',
	subscription: '/:uid',
} as const;

export type RoutePath = keyof typeof ROUTE_PATHS;

// =============================================================================
// 公共 Schema 定义
// =============================================================================

// 健康状态 Schema
export const HealthStatusSchema = z.object({
	code: z.literal(ResponseCodes.SUCCESS),
	msg: z.string(),
	data: z.object({
		status: z.string().describe('服务状态'),
		timestamp: z.string().describe('检查时间'),
	}),
});

// =============================================================================
// 认证参数定义
// =============================================================================

export const UserTokenParamSchema = z.object({
	token: z.string().describe('用户访问令牌'),
});

export const SuperAdminTokenParamSchema = z.object({
	superToken: z.string().describe('超级管理员访问令牌'),
});

export const UserIdParamSchema = z.object({
	uid: z.string().describe('用户唯一标识符'),
});
