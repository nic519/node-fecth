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
