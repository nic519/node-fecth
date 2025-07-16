import { ErrorResponseSchema } from '@/types/openapi-schemas';
import { createRoute, z } from '@hono/zod-openapi';
import { ROUTE_PATHS } from './common';

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
