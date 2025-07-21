import { BaseResponseSchema } from '@/types/openapi-schemas';
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
					schema: BaseResponseSchema,
				},
				'text/plain': {
					schema: z.string(),
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
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
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
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
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
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
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
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
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
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
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
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
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
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
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
		},
	},
});

