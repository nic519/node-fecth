import { z } from 'zod';

/**
 * 响应代码常量
 * 用于定义 API 响应的状态码
 */
export const ResponseCodes = {
	/**
	 * 成功响应
	 */
	SUCCESS: 0,
	/**
	 * 请求参数无效
	 */
	INVALID_PARAMS: 400,
	/**
	 * 未经授权，请先登录
	 */
	UNAUTHORIZED: 401,
	/**
	 * 权限不足，无法访问该资源
	 */
	FORBIDDEN: 403,
	/**
	 * 资源未找到
	 */
	NOT_FOUND: 404,
	/**
	 * 资源冲突，通常用于重复创建等场景
	 */
	CONFLICT: 409,
	/**
	 * 格式错误，通常用于数据验证失败
	 */
	FORMAT_ERROR: 422,
	/**
	 * 服务器内部错误
	 */
	INTERNAL_ERROR: 500,
} as const;

/**
 * 响应代码类型
 * 从 ResponseCodes 常量中提取的值类型
 */
export type ResponseCode = (typeof ResponseCodes)[keyof typeof ResponseCodes];

/**
 * 系统日志 Schema
 * 用于验证系统日志的数据结构
 */
export const SystemLogSchema = z.object({
	/**
	 * 日志生成时间
	 */
	time: z.string(),
	/**
	 * 日志级别
	 */
	level: z.enum(['INFO', 'WARN', 'ERROR', 'DEBUG']),
	/**
	 * 日志内容
	 */
	message: z.string(),
});

/**
 * 系统日志类型
 * 从 SystemLogSchema 推导出的 TypeScript 类型
 */
export type SystemLog = z.infer<typeof SystemLogSchema>;
