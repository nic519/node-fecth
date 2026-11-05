import { z } from 'zod';
import { UserConfigSchema } from '@/modules/user/user.schema';

/**
 * 注册请求 Schema
 * 用于验证用户注册时的请求参数
 */
export const RegisterRequestSchema = z.object({
	/**
	 * 用户ID，通常为系统生成的唯一标识
	 */
	uid: z.string().min(1, '用户ID不能为空'),
	/**
	 * 用户配置信息
	 * 包含订阅地址、访问令牌等
	 */
	config: UserConfigSchema,
});

/**
 * 注册请求类型
 * 从 RegisterRequestSchema 推导出的 TypeScript 类型
 */
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
