import { BaseResponseSchema } from '@/routes/modules/base/schema.base';
import { ScTemplateCreateReq } from '@/routes/modules/template/schema.template';
import { createRoute, z } from '@hono/zod-openapi';
import { SuperAdminTokenParamSchema } from '../../openapi/common';

// =============================================================================
// 配置模板管理路由
// =============================================================================

const API_PREFIX = '/api/admin/templates';

// 获取配置模板列表
export const RTemplatesList = createRoute({
	method: 'get',
	path: `${API_PREFIX}`,
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
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
		},
	},
});

// 创建配置模板
export const RTemplateCreate = createRoute({
	method: 'post',
	path: `${API_PREFIX}`,
	summary: '创建配置模板',
	description: '创建新的配置模板',
	tags: ['管理员'],
	request: {
		query: SuperAdminTokenParamSchema,
		body: {
			content: {
				'application/json': {
					schema: ScTemplateCreateReq,
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

// 更新配置模板
export const RTemplateUpdate = createRoute({
	method: 'put',
	path: `${API_PREFIX}/{templateId}`,
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
					schema: ScTemplateCreateReq,
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

// 删除配置模板
export const RTemplateDelete = createRoute({
	method: 'delete',
	path: `${API_PREFIX}/{templateId}`,
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
					schema: BaseResponseSchema,
				},
			},
			description: '操作结果：code=0表示成功，其他值表示具体错误',
		},
	},
});
