import { z } from 'zod';

/**
 * 管理员日志查询 Schema
 * 用于验证日志查询的参数
 */
export const AdminLogsQuerySchema = z.object({
	/**
	 * 分页页码，从 1 开始
	 */
	page: z.coerce.number().int().positive().optional(),
	/**
	 * 每页条数
	 */
	pageSize: z.coerce.number().int().positive().optional(),
	/**
	 * 日志级别过滤
	 */
	level: z.enum(['info', 'warn', 'error', 'audit']).optional(),
	/**
	 * 日志类型过滤，如 user_create, user_delete 等
	 */
	type: z.string().optional(),
	/**
	 * 用户ID过滤
	 */
	userId: z.string().optional(),
	/**
	 * 开始时间过滤 (ISO 8601)
	 */
	startTime: z.string().optional(),
	/**
	 * 结束时间过滤 (ISO 8601)
	 */
	endTime: z.string().optional(),
});

/**
 * 管理员日志查询类型
 * 从 AdminLogsQuerySchema 推导出的 TypeScript 类型
 */
export type AdminLogsQuery = z.infer<typeof AdminLogsQuerySchema>;
