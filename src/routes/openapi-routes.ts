import {
	AdminHealthCheckSchema,
	AdminLogSchema,
	ConfigTemplateSchema,
	CreateConfigTemplateRequestSchema,
	CreateUserRequestSchema,
	ErrorResponseSchema,
	SuccessResponseSchema,
	TrafficInfoSchema,
	UserConfigSchema,
	UserSummarySchema,
} from '@/types/openapi-schemas';
import { createRoute, z } from '@hono/zod-openapi';

// =============================================================================
// 路由路径常量定义
// =============================================================================

export const ROUTE_PATHS = {
	// === OpenAPI 标准路由 ===
	health: '/api/health',
	// 用户配置路由
	userUpdate: '/api/config/user/update/{uid}',
	userDetail: '/api/config/user/detail/{uid}',
	// 管理员路由
	adminUserCreate: '/api/admin/user/create',
	adminUserDelete: '/api/admin/user/delete/{uid}',
	allUsers: '/api/admin/user/all',

	// === 非 OpenAPI 路由（路径常量） ===
	storage: '/storage',
	kv: '/kv',
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

export const userUpdateRoute = createRoute({
	method: 'post',
	path: ROUTE_PATHS.userUpdate,
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

// 用户详情
export const getUserDetailRoute = createRoute({
	method: 'get',
	path: ROUTE_PATHS.userDetail,
	summary: '用户详情',
	description: '获取指定用户的详细信息',
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
			description: '用户详情',
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

export const adminUserCreateRoute = createRoute({
	method: 'post',
	path: ROUTE_PATHS.adminUserCreate,
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

// =============================================================================
// 超级管理员路由
// =============================================================================

// 系统统计
export const getSystemStatsRoute = createRoute({
	method: 'get',
	path: '/api/admin/stats',
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
					schema: z.object({
						success: z.boolean(),
						data: z.object({
							totalUsers: z.number(),
							activeUsers: z.number(),
							configCompleteRate: z.number(),
							totalTraffic: z.number(),
							usedTraffic: z.number(),
							timestamp: z.string(),
						}),
					}),
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

// 刷新用户流量信息
export const refreshUserTrafficRoute = createRoute({
	method: 'post',
	path: '/api/admin/users/{userId}/traffic/refresh',
	summary: '刷新用户流量信息',
	description: '强制刷新指定用户的流量统计信息',
	tags: ['管理员'],
	request: {
		params: z.object({
			userId: z.string().describe('用户ID'),
		}),
		query: SuperAdminTokenParamSchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: z.object({
						success: z.boolean(),
						data: z.object({
							message: z.string(),
							userId: z.string(),
							trafficInfo: TrafficInfoSchema,
						}),
					}),
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
					schema: z.object({
						success: z.boolean(),
						data: z.object({
							templates: z.array(ConfigTemplateSchema),
						}),
					}),
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
		201: {
			content: {
				'application/json': {
					schema: z.object({
						success: z.boolean(),
						data: z.object({
							message: z.string(),
							template: ConfigTemplateSchema,
						}),
					}),
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
						userId: z.string().describe('目标用户ID'),
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
							userId: z.string(),
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
	path: '/api/admin/logs',
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
					schema: z.object({
						success: z.boolean(),
						data: z.object({
							logs: z.array(AdminLogSchema),
						}),
					}),
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

// 管理员健康检查
export const adminHealthRoute = createRoute({
	method: 'get',
	path: '/api/admin/health',
	summary: '管理员健康检查',
	description: '获取系统健康状态信息',
	tags: ['管理员'],
	request: {
		query: SuperAdminTokenParamSchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: z.object({
						success: z.boolean(),
						data: AdminHealthCheckSchema,
					}),
				},
			},
			description: '健康状态',
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
