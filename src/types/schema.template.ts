import { ResponseCodes } from '@/types/openapi-schemas';
import { z } from 'zod';

// =============================================================================
// 配置模板相关 Schemas
// =============================================================================

// 配置模板 Schema
export const ScTemplateModel = z.object({
	id: z.union([z.number(), z.string()]), // 支持数字或字符串ID
	name: z.string(),
	description: z.string(),
	content: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

// 配置模板列表响应 Schema
export const ScTemplateListResp = z.object({
	code: z.literal(ResponseCodes.SUCCESS),
	msg: z.string(),
	data: z.object({
		templates: z.array(ScTemplateModel),
	}),
});

// 创建配置模板请求 Schema
export const ScTemplateCreateReq = z.object({
	name: z.string().min(1, '模板名称不能为空'),
	description: z.string(),
	content: z.string().min(1, '模板内容不能为空'),
});

// 创建配置模板响应 Schema
export const ScTemplateCreateResp = z.object({
	code: z.literal(ResponseCodes.SUCCESS),
	msg: z.string(),
	data: z.object({
		message: z.string(),
		template: ScTemplateModel,
	}),
});

// =============================================================================
// 导出 TypeScript 类型
// =============================================================================

export type IScTemplateModel = z.infer<typeof ScTemplateModel>;
export type IScTemplateListResp = z.infer<typeof ScTemplateListResp>;
export type IScTemplateCreateReq = z.infer<typeof ScTemplateCreateReq>;
export type IScTemplateCreateResp = z.infer<typeof ScTemplateCreateResp>;
