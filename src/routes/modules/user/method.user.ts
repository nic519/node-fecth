import { ScUserAdminUpdateResponse, ScUserGetResponse, ScUserTokenParams, ScUserUpdateReq } from '@/routes/modules/user/schema.user';
import { createRoute } from '@hono/zod-openapi';

// =============================================================================
// 用户配置管理路由（标准 REST API）
// =============================================================================

/**
 * 获取用户配置
 * GET /api/user?uid=xxx&token=xxx
 */
export const getUserRoute = createRoute({
	method: 'get',
	path: '/api/user',
	operationId: 'getUser',
	summary: '获取用户配置',
	description: '获取指定用户的详细配置信息（需要用户身份验证）',
	tags: ['用户配置'],
	request: {
		query: ScUserTokenParams,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: ScUserGetResponse,
				},
			},
			description: '成功获取用户配置',
		},
	},
});

/**
 * 更新用户配置
 * PUT /api/user?uid=xxx&token=xxx
 */
export const updateUserRoute = createRoute({
	method: 'put',
	path: '/api/user',
	operationId: 'updateUser',
	summary: '更新用户配置',
	description: '更新指定用户的配置信息（需要用户身份验证）',
	tags: ['用户配置'],
	request: {
		query: ScUserTokenParams,
		body: {
			content: {
				'application/json': {
					schema: ScUserUpdateReq,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: ScUserAdminUpdateResponse,
				},
			},
			description: '成功更新用户配置',
		},
	},
});
