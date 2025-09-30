import {
	AdminLogSchema,
	AdminLogsResponseSchema,
	AdminStatsResponseSchema,
	BaseResponseSchema,
	ConfigTemplateSchema,
	ConfigTemplatesResponseSchema,
	CreateConfigTemplateRequestSchema,
	CreateTemplateResponseSchema,
	CreateUserRequestSchema,
	RefreshTrafficResponseSchema,
	TrafficInfoSchema,
	UserSummarySchema,
	UsersListResponseSchema,
} from '@/types/openapi-schemas';
import { createRoute, z } from '@hono/zod-openapi';
import { MyRouter, SuperAdminTokenParamSchema } from './common';

// =============================================================================
// 管理员路由
// =============================================================================

export const adminGetUsersRoute = createRoute({
	method: 'get',
	path: MyRouter.allUsers,
	operationId: 'adminGetUsers',
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
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
		},
	},
});

export const adminUserCreateRoute = createRoute({
	method: 'post',
	path: MyRouter.adminUserCreate,
	operationId: 'adminUserCreate',
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
		200: {
			content: {
				'application/json': {
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
		},
	},
});

// 管理员删除用户
export const adminDeleteUserRoute = createRoute({
	method: 'post',
	path: MyRouter.adminUserDelete,
	operationId: 'adminDeleteUser',
	summary: '管理员删除用户',
	description: '管理员删除指定用户及其所有数据',
	tags: ['管理员'],
	request: { 
		query: SuperAdminTokenParamSchema,
		body: {
			content: {
				'application/json': {
					schema: z.object({
						uid: z.string().describe('用户ID'),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
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
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
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
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
		},
	},
});

// 获取配置模板列表
export const getConfigTemplatesRoute = createRoute({
	method: 'get',
	path: '/api/admin/templates',
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
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
		},
	},
});

// 创建配置模板
export const createConfigTemplateRoute = createRoute({
	method: 'post',
	path: '/api/admin/templates',
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
		200: {
			content: {
				'application/json': {
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
		},
	},
});

// 更新配置模板
export const updateConfigTemplateRoute = createRoute({
	method: 'put',
	path: '/api/admin/templates/{templateId}',
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
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
		},
	},
});

// 删除配置模板
export const deleteConfigTemplateRoute = createRoute({
	method: 'delete',
	path: '/api/admin/templates/{templateId}',
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
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
		},
	},
});

// 应用模板到用户
export const applyTemplateRoute = createRoute({
	method: 'post',
	path: '/api/admin/templates/{templateId}/apply',
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
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
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
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
		},
	},
});

