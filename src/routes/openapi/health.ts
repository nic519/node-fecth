import { AdminHealthCheckSchema } from '@/types/openapi-schemas';
import { createRoute, z } from '@hono/zod-openapi';
import { HealthStatusSchema, SuperAdminTokenParamSchema } from './common';

// =============================================================================
// 健康检查路由
// =============================================================================

export const healthRoute = createRoute({
	method: 'get',
	path: '/api/health',
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
					schema: z.object({
						error: z.string(),
						message: z.string().optional(),
					}),
				},
			},
			description: '未授权访问',
		},
	},
});
