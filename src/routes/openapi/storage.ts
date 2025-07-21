import { ErrorResponseSchema, SuccessResponseSchema } from '@/types/openapi-schemas';
import { createRoute, z } from '@hono/zod-openapi';
import { MyRouter } from './common';

// =============================================================================
// 存储和 KV 管理路由
// =============================================================================

export const storageRoute = createRoute({
	method: 'get',
	path: MyRouter.storage,
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
	path: MyRouter.storage,
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
	path: MyRouter.storage,
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
	path: MyRouter.storage,
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
	path: MyRouter.kv,
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
	path: MyRouter.kv,
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
	path: MyRouter.kv,
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
	path: MyRouter.kv,
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
