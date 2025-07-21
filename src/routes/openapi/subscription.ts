import { ErrorResponseSchema } from '@/types/openapi-schemas';
import { createRoute, z } from '@hono/zod-openapi';
import { MyRouter } from './common';

// =============================================================================
// 订阅路由
// =============================================================================

export const getSubscriptionRoute = createRoute({
	method: 'get',
	path: MyRouter.subscription,
	summary: '获取订阅配置',
	description: '获取用户的 Clash 订阅配置',
	tags: ['订阅'],
	request: {
		query: z.object({
			uid: z.string().describe('用户标识符'),
			token: z.string().describe('用户访问令牌'),
			download: z.coerce.boolean().optional().describe('是否作为下载文件'),
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
