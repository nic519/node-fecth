import { z } from 'zod';

// =============================================================================
// 基础响应 Schemas
// =============================================================================

export const BaseResponseSchema = z.object({
	code: z.number().describe('响应代码：0=成功，其他=错误码').default(0),
	msg: z.string().describe('响应消息'),
	data: z.any().optional().describe('响应数据'),
});

export type BaseResponse = z.infer<typeof BaseResponseSchema>;
