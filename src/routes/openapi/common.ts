import { ResponseCodes } from '@/types/openapi-schemas';
import { z } from '@hono/zod-openapi';

// =============================================================================
// 路由路径常量定义
// =============================================================================

export const MyRouter = {
	// === OpenAPI 标准路由 ===
	health: '/api/health',
	// 用户配置路由
	userUpdate: '/api/user',
	userDetail: '/api/user',
	// 管理员路由
	adminUserCreate: '/api/admin/user/create',
	adminUserDelete: '/api/admin/user/delete',
	allUsers: '/api/admin/user/all',

	// 存储路由
	storage: '/api/storage',
	kv: '/api/kv',
	// 订阅路由
	subscription: '/api/x',
} as const;

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
	uid: z.string().describe('用户唯一标识符'),
	token: z.string().describe('用户访问令牌'),
});

export const SuperAdminTokenParamSchema = z.object({
	superToken: z.string().describe('超级管理员访问令牌'),
});
