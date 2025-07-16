import {
	CreateUserRequestSchema,
	ErrorResponseSchema,
	SuccessResponseSchema,
	UserConfigSchema,
	UserSummarySchema,
} from '@/types/openapi-schemas';
import { createRoute, z } from '@hono/zod-openapi';

// =============================================================================
// 路由路径常量定义
// =============================================================================

export const ROUTE_PATHS = {
	// === OpenAPI 标准路由 ===
	health: '/health',
	userConfig: '/api/config/users/{uid}',
	allUsersLegacy: '/api/config/allUsers',
	generalUserConfig: '/api/config/users',
	createUser: '/create/user',
	adminUsers: '/api/admin/users',

	// === 非 OpenAPI 路由（路径常量） ===
	storage: '/storage',
	kv: '/kv',
	adminPrefix: '/api/admin',
	subscription: '/:uid',
} as const;

export type RoutePath = keyof typeof ROUTE_PATHS;

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
	uid: z.string().describe('用户唯一标识符'),
});

// =============================================================================
// 健康检查路由
// =============================================================================

export const healthRoute = createRoute({
	method: 'get',
	path: ROUTE_PATHS.health,
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
	path: ROUTE_PATHS.userConfig,
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
	path: ROUTE_PATHS.userConfig,
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
	path: ROUTE_PATHS.userConfig,
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
	path: ROUTE_PATHS.adminUsers,
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

// 为了兼容旧API，添加 /api/config/allUsers 路由
export const getAllUsersLegacyRoute = createRoute({
	method: 'get',
	path: ROUTE_PATHS.allUsersLegacy,
	summary: '获取所有用户列表（兼容路由）',
	description: '获取系统中所有用户的摘要信息（需要管理员权限）- 兼容旧API路径',
	tags: ['用户配置'],
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

// 通用用户配置路由（不带用户ID的路由）
export const generalUserConfigRoute = createRoute({
	method: 'get',
	path: ROUTE_PATHS.generalUserConfig,
	summary: '通用用户配置操作',
	description: '处理不带特定用户ID的用户配置请求',
	tags: ['用户配置'],
	request: {
		query: z.object({
			user: z.string().optional().describe('用户标识符（查询参数）'),
			token: z.string().optional().describe('用户访问令牌'),
			superToken: z.string().optional().describe('超级管理员访问令牌'),
		}),
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: z.union([UserConfigSchema, z.array(UserSummarySchema)]),
				},
			},
			description: '用户配置或用户列表',
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

// =============================================================================
// 存储和 KV 管理路由
// =============================================================================

export const storageRoute = createRoute({
	method: 'get',
	path: ROUTE_PATHS.storage,
	summary: '存储内容获取操作',
	description: '获取存储内容',
	tags: ['存储'],
	request: {
		query: z.object({
			action: z.string().optional().describe('操作类型'),
			key: z.string().optional().describe('存储键'),
			token: z.string().optional().describe('访问令牌'),
		}),
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: z.object({}),
				},
				'text/plain': {
					schema: z.string(),
				},
			},
			description: '操作成功',
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

export const storagePostRoute = createRoute({
	method: 'post',
	path: ROUTE_PATHS.storage,
	summary: '存储内容写入操作',
	description: '写入存储内容',
	tags: ['存储'],
	request: {
		body: {
			content: {
				'application/json': {
					schema: z.object({
						key: z.string().describe('存储键'),
						value: z.any().describe('存储值'),
					}),
				},
			},
		},
		query: z.object({
			token: z.string().optional().describe('访问令牌'),
		}),
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: SuccessResponseSchema,
				},
			},
			description: '写入成功',
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

export const storagePutRoute = createRoute({
	method: 'put',
	path: ROUTE_PATHS.storage,
	summary: '存储内容更新操作',
	description: '更新存储内容',
	tags: ['存储'],
	request: {
		body: {
			content: {
				'application/json': {
					schema: z.object({
						key: z.string().describe('存储键'),
						value: z.any().describe('存储值'),
					}),
				},
			},
		},
		query: z.object({
			token: z.string().optional().describe('访问令牌'),
		}),
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

export const storageDeleteRoute = createRoute({
	method: 'delete',
	path: ROUTE_PATHS.storage,
	summary: '存储内容删除操作',
	description: '删除存储内容',
	tags: ['存储'],
	request: {
		query: z.object({
			key: z.string().describe('存储键'),
			token: z.string().optional().describe('访问令牌'),
		}),
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

export const kvRoute = createRoute({
	method: 'get',
	path: ROUTE_PATHS.kv,
	summary: 'KV 存储操作',
	description: 'Key-Value 存储的获取和管理操作',
	tags: ['KV存储'],
	request: {
		query: z.object({
			key: z.string().optional().describe('存储键'),
			namespace: z.string().optional().describe('命名空间'),
			token: z.string().optional().describe('访问令牌'),
		}),
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: z.object({
						data: z.any().optional().describe('存储的数据'),
						key: z.string().optional().describe('存储键'),
						namespace: z.string().optional().describe('命名空间'),
					}),
				},
			},
			description: 'KV 操作成功',
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

// 为了支持不同 HTTP 方法，添加 POST 版本
export const kvPostRoute = createRoute({
	method: 'post',
	path: ROUTE_PATHS.kv,
	summary: 'KV 存储写入操作',
	description: 'Key-Value 存储的写入操作',
	tags: ['KV存储'],
	request: {
		body: {
			content: {
				'application/json': {
					schema: z.object({
						key: z.string().describe('存储键'),
						value: z.any().describe('存储值'),
						namespace: z.string().optional().describe('命名空间'),
					}),
				},
			},
		},
		query: z.object({
			token: z.string().optional().describe('访问令牌'),
		}),
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: SuccessResponseSchema,
				},
			},
			description: 'KV 写入成功',
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

export const kvPutRoute = createRoute({
	method: 'put',
	path: ROUTE_PATHS.kv,
	summary: 'KV 存储更新操作',
	description: 'Key-Value 存储的更新操作',
	tags: ['KV存储'],
	request: {
		body: {
			content: {
				'application/json': {
					schema: z.object({
						key: z.string().describe('存储键'),
						value: z.any().describe('存储值'),
						namespace: z.string().optional().describe('命名空间'),
					}),
				},
			},
		},
		query: z.object({
			token: z.string().optional().describe('访问令牌'),
		}),
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: SuccessResponseSchema,
				},
			},
			description: 'KV 更新成功',
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

export const kvDeleteRoute = createRoute({
	method: 'delete',
	path: ROUTE_PATHS.kv,
	summary: 'KV 存储删除操作',
	description: 'Key-Value 存储的删除操作',
	tags: ['KV存储'],
	request: {
		query: z.object({
			key: z.string().describe('存储键'),
			namespace: z.string().optional().describe('命名空间'),
			token: z.string().optional().describe('访问令牌'),
		}),
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: SuccessResponseSchema,
				},
			},
			description: 'KV 删除成功',
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

export const createUserRoute = createRoute({
	method: 'put',
	path: ROUTE_PATHS.createUser,
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
	path: ROUTE_PATHS.subscription,
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
