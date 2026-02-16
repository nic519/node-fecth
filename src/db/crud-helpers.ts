/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseCRUD } from '@/db/base-crud';
import { ResponseCodes } from '@/types/openapi-schemas';

/**
 * CRUD 辅助函数集合
 * 用于简化常见的业务逻辑模式
 */

/**
 * 根据ID获取记录并执行自定义操作
 * 自动处理 404 错误和异常
 *
 * @example
 * ```typescript
 * await withRecord(c, templates, 'templateId', '模板', async (template) => {
 *   // 自定义业务逻辑
 *   const url = generateUrl(template);
 *   return { url, name: template.name };
 * });
 * ```
 */
export async function withRecord<T extends { id: string; createdAt: string; updatedAt: string }, R = any>(
	c: any,
	table: any,
	idParamName: string,
	resourceName: string,
	handler: (record: T) => Promise<R> | R
): Promise<any> {
	try {
		const id = c.req.param(idParamName);
		const crud = new BaseCRUD<T>(c.env as Env, table);
		const record = await crud.selectById(id);

		if (!record) {
			return c.json(
				{
					code: ResponseCodes.NOT_FOUND,
					msg: `${resourceName}不存在`,
				},
				404
			);
		}

		// 执行自定义处理逻辑
		const result = await handler(record);

		return c.json({
			code: ResponseCodes.SUCCESS,
			msg: '操作成功',
			data: result,
		});
	} catch (error) {
		console.error(`❌ ${resourceName} - 操作失败:`, error);
		return c.json(
			{
				code: ResponseCodes.INTERNAL_ERROR,
				msg: error instanceof Error ? error.message : '操作失败',
			},
			500
		);
	}
}

/**
 * 根据ID获取记录并执行自定义操作（带自定义成功消息）
 *
 * @example
 * ```typescript
 * await withRecordAndMessage(c, templates, 'templateId', '模板', '获取订阅URL成功', async (template) => {
 *   return {
 *     subscribeUrl: `${baseUrl}/api/subscription/template/${template.id}`,
 *     templateName: template.name,
 *   };
 * });
 * ```
 */
export async function withRecordAndMessage<T extends { id: string; createdAt: string; updatedAt: string }, R = any>(
	c: any,
	table: any,
	idParamName: string,
	resourceName: string,
	successMessage: string,
	handler: (record: T, context: any) => Promise<R> | R
): Promise<any> {
	try {
		const id = c.req.param(idParamName);
		const crud = new BaseCRUD<T>(c.env as Env, table);
		const record = await crud.selectById(id);

		if (!record) {
			return c.json(
				{
					code: ResponseCodes.NOT_FOUND,
					msg: `${resourceName}不存在`,
				},
				404
			);
		}

		// 执行自定义处理逻辑，传递上下文
		const result = await handler(record, { id, c });

		return c.json({
			code: ResponseCodes.SUCCESS,
			msg: successMessage,
			data: result,
		});
	} catch (error) {
		console.error(`❌ ${resourceName} - 操作失败:`, error);
		return c.json(
			{
				code: ResponseCodes.INTERNAL_ERROR,
				msg: error instanceof Error ? error.message : '操作失败',
			},
			500
		);
	}
}

/**
 * 获取请求的基础URL
 */
export function getBaseUrl(c: any): string {
	return new URL(c.req.url).origin;
}
