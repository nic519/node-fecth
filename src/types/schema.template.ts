import { ResponseCodes } from '@/types/api-schemas';
import type { VisualTemplateModel } from '@/app/admin/templates/visual-template/types';
import { z } from 'zod';

const VisualTemplateModelSchema = z.custom<VisualTemplateModel>(
	(value) => typeof value === 'object' && value !== null && (value as { version?: unknown }).version === 1,
	'可视化模板模型格式无效',
);

/**
 * 配置模板 Schema。
 *
 * 描述后台模板列表和模板详情中返回的单个配置模板。
 */
export const ConfigTemplateSchema = z.object({
	// 模板唯一标识；兼容数据库数字 ID 和接口字符串 ID。
	id: z.union([z.number(), z.string()]),
	// 模板格式；旧数据没有该字段时默认按原始 YAML 模板处理。
	format: z.enum(['yaml', 'visual-v1']).optional(),
	// 模板名称。
	name: z.string(),
	// 模板说明。
	description: z.string(),
	// 模板 YAML 或文本内容。
	content: z.string(),
	// 可视化模板模型；传统 YAML 模板为空。
	visualModel: VisualTemplateModelSchema.nullable().optional(),
	// 模板创建时间，使用 ISO 日期时间字符串。
	createdAt: z.string(),
	// 模板最后更新时间，使用 ISO 日期时间字符串。
	updatedAt: z.string(),
});

/**
 * 配置模板列表响应 Schema。
 *
 * 描述管理端获取模板列表接口的成功响应结构。
 */
export const ConfigTemplateListResponseSchema = z.object({
	// 业务响应码，成功时固定为 ResponseCodes.SUCCESS。
	code: z.literal(ResponseCodes.SUCCESS),
	// 响应消息。
	msg: z.string(),
	// 响应数据。
	data: z.object({
		// 配置模板列表。
		templates: z.array(ConfigTemplateSchema),
	}),
});

/**
 * 创建或更新配置模板请求 Schema。
 *
 * 用于校验新增模板和编辑模板时提交的请求体。
 */
export const ConfigTemplateSaveRequestSchema = z.object({
	// 模板名称，不能为空。
	name: z.string().min(1, '模板名称不能为空'),
	// 模板格式；旧模板继续使用 yaml，新模板可选择 visual-v1。
	format: z.enum(['yaml', 'visual-v1']).optional(),
	// 模板说明。
	description: z.string(),
	// 模板内容，不能为空。
	content: z.string().min(1, '模板内容不能为空'),
	// 可视化模板模型；visual-v1 保存时写入，yaml 模板留空。
	visualModel: VisualTemplateModelSchema.nullable().optional(),
});

/**
 * 创建配置模板响应 Schema。
 *
 * 描述管理端创建模板接口的成功响应结构。
 */
export const ConfigTemplateCreateResponseSchema = z.object({
	// 业务响应码，成功时固定为 ResponseCodes.SUCCESS。
	code: z.literal(ResponseCodes.SUCCESS),
	// 响应消息。
	msg: z.string(),
	// 响应数据。
	data: z.object({
		// 创建结果说明。
		message: z.string(),
		// 创建后的模板对象。
		template: ConfigTemplateSchema,
	}),
});

/**
 * 配置模板类型。
 */
export type ConfigTemplate = z.infer<typeof ConfigTemplateSchema>;

/**
 * 配置模板列表响应类型。
 */
export type ConfigTemplateListResponse = z.infer<typeof ConfigTemplateListResponseSchema>;

/**
 * 创建或更新配置模板请求类型。
 */
export type ConfigTemplateSaveRequest = z.infer<typeof ConfigTemplateSaveRequestSchema>;

/**
 * 创建配置模板响应类型。
 */
export type ConfigTemplateCreateResponse = z.infer<typeof ConfigTemplateCreateResponseSchema>;
