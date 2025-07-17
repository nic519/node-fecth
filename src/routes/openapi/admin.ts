import {
	AdminLogSchema,
	AdminLogsResponseSchema,
	AdminStatsResponseSchema,
	ConfigTemplateSchema,
	ConfigTemplatesResponseSchema,
	CreateConfigTemplateRequestSchema,
	CreateTemplateResponseSchema,
	CreateUserRequestSchema,
	ErrorResponseSchema,
	RefreshTrafficResponseSchema,
	SuccessResponseSchema,
	TrafficInfoSchema,
	UserSummarySchema,
	UsersListResponseSchema,
} from '@/types/openapi-schemas';
import { createRoute, z } from '@hono/zod-openapi';
import { ROUTE_PATHS, SuperAdminTokenParamSchema, UserIdParamSchema } from './common';

// =============================================================================
// 管理员路由
// =============================================================================

export const adminGetUsersRoute = createRoute({
	method: 'get',
	path: ROUTE_PATHS.allUsers,
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
					schema: UsersListResponseSchema,
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

export const adminUserCreateRoute = createRoute({
	method: 'post',
	path: ROUTE_PATHS.adminUserCreate,
	summary: '创建新用户',
	description: '创建新用户配置（需要管理员权限）',
	tags: ['管理员'],
	request: {
		query: SuperAdminTokenParamSchema,
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

// 管理员删除用户
export const adminDeleteUserRoute = createRoute({
	method: 'get',
	path: ROUTE_PATHS.adminUserDelete,
	summary: '管理员删除用户',
	description: '管理员删除指定用户及其所有数据',
	tags: ['管理员'],
	request: {
		params: UserIdParamSchema,
		query: SuperAdminTokenParamSchema,
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
		404: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: '用户不存在',
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

// =============================================================================
// 超级管理员路由
// =============================================================================

// 系统统计
export const getSystemStatsRoute = createRoute({
	method: 'get',
	path: '/admin/stats',
	summary: '获取系统统计',
	description: '获取系统的统计信息，包括用户数量、流量等',
	tags: ['管理员'],
	request: {
		query: SuperAdminTokenParamSchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: AdminStatsResponseSchema,
				},
			},
			description: '系统统计信息',
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

// 刷新用户流量信息
export const refreshUserTrafficRoute = createRoute({
	method: 'post',
	path: '/admin/users/{uid}/traffic/refresh',
	summary: '刷新用户流量信息',
	description: '强制刷新指定用户的流量统计信息',
	tags: ['管理员'],
	request: {
		params: z.object({
			uid: z.string().describe('用户ID'),
		}),
		query: SuperAdminTokenParamSchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: RefreshTrafficResponseSchema,
				},
			},
			description: '刷新成功',
		},
		404: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: '用户不存在',
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

// 获取配置模板列表
export const getConfigTemplatesRoute = createRoute({
	method: 'get',
	path: '/admin/templates',
	summary: '获取配置模板列表',
	description: '获取所有可用的配置模板',
	tags: ['管理员'],
	request: {
		query: SuperAdminTokenParamSchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: ConfigTemplatesResponseSchema,
				},
			},
			description: '配置模板列表',
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

// 创建配置模板
export const createConfigTemplateRoute = createRoute({
	method: 'post',
	path: '/admin/templates',
	summary: '创建配置模板',
	description: '创建新的配置模板',
	tags: ['管理员'],
	request: {
		query: SuperAdminTokenParamSchema,
		body: {
			content: {
				'application/json': {
					schema: CreateConfigTemplateRequestSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				'application/json': {
					schema: CreateTemplateResponseSchema,
				},
			},
			description: '模板创建成功',
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

// 更新配置模板
export const updateConfigTemplateRoute = createRoute({
	method: 'put',
	path: '/admin/templates/{templateId}',
	summary: '更新配置模板',
	description: '更新指定的配置模板',
	tags: ['管理员'],
	request: {
		params: z.object({
			templateId: z.string().describe('模板ID'),
		}),
		query: SuperAdminTokenParamSchema,
		body: {
			content: {
				'application/json': {
					schema: CreateConfigTemplateRequestSchema,
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
		404: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: '模板不存在',
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

// 删除配置模板
export const deleteConfigTemplateRoute = createRoute({
	method: 'delete',
	path: '/admin/templates/{templateId}',
	summary: '删除配置模板',
	description: '删除指定的配置模板',
	tags: ['管理员'],
	request: {
		params: z.object({
			templateId: z.string().describe('模板ID'),
		}),
		query: SuperAdminTokenParamSchema,
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
		404: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: '模板不存在',
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

// 应用模板到用户
export const applyTemplateRoute = createRoute({
	method: 'post',
	path: '/admin/templates/{templateId}/apply',
	summary: '应用模板到用户',
	description: '将指定模板应用到用户配置',
	tags: ['管理员'],
	request: {
		params: z.object({
			templateId: z.string().describe('模板ID'),
		}),
		query: SuperAdminTokenParamSchema,
		body: {
			content: {
				'application/json': {
					schema: z.object({
						uid: z.string().describe('目标用户ID'),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: z.object({
						success: z.boolean(),
						data: z.object({
							message: z.string(),
							templateId: z.string(),
							uid: z.string(),
						}),
					}),
				},
			},
			description: '应用成功',
		},
		404: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: '模板或用户不存在',
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

// 获取管理员日志
export const getAdminLogsRoute = createRoute({
	method: 'get',
	path: '/admin/logs',
	summary: '获取管理员操作日志',
	description: '获取管理员的操作日志',
	tags: ['管理员'],
	request: {
		query: z.object({
			superToken: z.string().describe('超级管理员访问令牌'),
			date: z.string().optional().describe('日期过滤 (YYYY-MM-DD)'),
			limit: z.string().optional().describe('返回数量限制'),
		}),
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: AdminLogsResponseSchema,
				},
			},
			description: '操作日志',
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
