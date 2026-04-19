import { z } from 'zod';

/**
 * 通用 API 响应 Schema。
 *
 * 描述项目接口返回的基础包裹结构，业务接口可以在 data 中放入具体数据。
 */
export const BaseResponseSchema = z.object({
	// 业务响应码，默认 0 表示成功。
	code: z.number().default(0),
	// 响应消息，用于描述成功或错误原因。
	msg: z.string(),
	// 可选响应数据，具体结构由各业务接口定义。
	data: z.any().optional(),
});

/**
 * 通用 API 响应类型。
 *
 * 由 BaseResponseSchema 推导而来。
 */
export type BaseResponse = z.infer<typeof BaseResponseSchema>;
