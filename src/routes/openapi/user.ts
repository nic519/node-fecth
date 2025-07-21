import { ErrorResponseSchema, SuccessResponseSchema, UserConfigSchema, UserDetailResponseSchema } from '@/types/openapi-schemas';
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
					schema: UserDetailResponseSchema,
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
