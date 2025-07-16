import {
	CreateUserRequestSchema,
	ErrorResponseSchema,
	SuccessResponseSchema,
	UserConfigSchema,
	UserSummarySchema,
} from '@/types/openapi-schemas';
import { createRoute, z } from '@hono/zod-openapi';

// 健康状态 Schema（本地定义）
const HealthStatusSchema = z.object({
	status: z.string().describe('服务状态'),
	timestamp: z.string().describe('检查时间'),
});

// =============================================================================
// 认证参数定义
// =============================================================================

const UserTokenParamSchema = z.object({
	token: z.string().describe('用户访问令牌'),
});

const SuperAdminTokenParamSchema = z.object({
	superToken: z.string().describe('超级管理员访问令牌'),
});

const UserIdParamSchema = z.object({
	userId: z.string().describe('用户唯一标识符'),
});

// =============================================================================
// 健康检查路由
// =============================================================================

export const healthRoute = createRoute({
	method: 'get',
	path: '/health',
	summary: '健康检查',
	description: '检查服务状态',
	tags: ['系统'],
	responses: {
		200: {
			content: {
				'application/json': {
					schema: HealthStatusSchema,
				},
			},
			description: '服务正常',
		},
	},
});

// =============================================================================
// 用户配置管理路由
// =============================================================================

export const getUserConfigRoute = createRoute({
	method: 'get',
	path: '/api/config/users/{userId}',
	summary: '获取用户配置',
	description: '获取指定用户的配置信息',
	tags: ['用户配置'],
	request: {
		params: UserIdParamSchema,
		query: UserTokenParamSchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: UserConfigSchema,
				},
			},
			description: '用户配置信息',
		},
		401: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: '未授权访问',
		},
		404: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: '用户不存在',
		},
	},
});

export const updateUserConfigRoute = createRoute({
	method: 'put',
	path: '/api/config/users/{userId}',
	summary: '更新用户配置',
	description: '更新指定用户的配置信息',
	tags: ['用户配置'],
	request: {
		params: UserIdParamSchema,
		query: UserTokenParamSchema,
		body: {
			content: {
				'application/json': {
					schema: UserConfigSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: SuccessResponseSchema,
				},
			},
			description: '更新成功',
		},
		400: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: '请求参数错误',
		},
		401: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: '未授权访问',
		},
	},
});

export const deleteUserConfigRoute = createRoute({
	method: 'delete',
	path: '/api/config/users/{userId}',
	summary: '删除用户配置',
	description: '删除指定用户的配置信息',
	tags: ['用户配置'],
	request: {
		params: UserIdParamSchema,
		query: UserTokenParamSchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: SuccessResponseSchema,
				},
			},
			description: '删除成功',
		},
		401: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: '未授权访问',
		},
		404: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: '用户不存在',
		},
	},
});

// =============================================================================
// 管理员路由
// =============================================================================

export const getAllUsersRoute = createRoute({
	method: 'get',
	path: '/api/admin/users',
	summary: '获取所有用户列表',
	description: '获取系统中所有用户的摘要信息（需要管理员权限）',
	tags: ['管理员'],
	request: {
		query: SuperAdminTokenParamSchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: z.array(UserSummarySchema),
				},
			},
			description: '用户列表',
		},
		401: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: '未授权访问',
		},
	},
});

export const createUserRoute = createRoute({
	method: 'put',
	path: '/create/user',
	summary: '创建新用户',
	description: '创建新用户配置（需要管理员权限）',
	tags: ['管理员'],
	request: {
		body: {
			content: {
				'application/json': {
					schema: CreateUserRequestSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				'application/json': {
					schema: SuccessResponseSchema,
				},
			},
			description: '用户创建成功',
		},
		400: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: '请求参数错误',
		},
		401: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: '未授权访问',
		},
		409: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: '用户已存在',
		},
	},
});

// =============================================================================
// 订阅路由
// =============================================================================

export const getSubscriptionRoute = createRoute({
	method: 'get',
	path: '/{uid}',
	summary: '获取订阅配置',
	description: '获取用户的 Clash 订阅配置',
	tags: ['订阅'],
	request: {
		params: z.object({
			uid: z.string().describe('用户标识符'),
		}),
		query: z.object({
			token: z.string().describe('用户访问令牌'),
			type: z.enum(['clash', 'v2ray', 'ss']).optional().describe('配置文件类型'),
			udp: z.boolean().optional().describe('是否启用UDP'),
			download: z.boolean().optional().describe('是否作为下载文件'),
		}),
	},
	responses: {
		200: {
			content: {
				'text/yaml': {
					schema: z.string(),
				},
				'application/json': {
					schema: z.object({}),
				},
			},
			description: 'Clash配置文件',
		},
		400: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: '请求参数错误',
		},
		401: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: '未授权访问',
		},
	},
});
