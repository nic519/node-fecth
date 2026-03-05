import { z } from 'zod';
import { UserConfigSchema } from '@/modules/user/user.schema';
import { ResponseCodes } from './common';

/**
 * 用户列表响应 Schema
 * 用于描述管理员获取用户列表时的响应结构
 */
export const UsersListResponseSchema = z.object({
	/**
	 * 响应状态码，成功时为 0
	 */
	code: z.literal(ResponseCodes.SUCCESS),
	/**
	 * 响应消息
	 */
	msg: z.string(),
	/**
	 * 响应数据
	 */
	data: z.object({
		/**
		 * 用户配置列表
		 */
		users: z.array(UserConfigSchema),
		/**
		 * 用户总数
		 */
		count: z.number(),
		/**
		 * 响应时间戳 (ISO 8601)
		 */
		timestamp: z.string(),
	}),
});

/**
 * 用户列表响应类型
 * 从 UsersListResponseSchema 推导出的 TypeScript 类型
 */
export type UsersListResponse = z.infer<typeof UsersListResponseSchema>;
