import { BaseResponseSchema, UserConfigSchema } from '@/types/openapi-schemas';
import { createRoute } from '@hono/zod-openapi';
import { MyRouter, UserTokenParamSchema } from './common';
import { z } from 'zod';

// =============================================================================
// 用户配置管理路由
// =============================================================================

export const userUpdateRoute = createRoute({
	method: 'post',
	path: MyRouter.userUpdate,
	summary: '更新用户配置',
	description: '更新指定用户的配置信息',
	tags: ['用户配置'],
	request: { 
		query: UserTokenParamSchema,
		body: {
			content: {
				'application/json': {
					schema: z.object({
						config: UserConfigSchema,
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

export const getUserDetailRoute = createRoute({
	method: 'get',
	path: MyRouter.userDetail,
	summary: '用户详情',
	description: '获取指定用户的详细信息',
	tags: ['用户配置'],
	request: { 
		query: UserTokenParamSchema,
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


