import { ResponseCodes } from '@/types/openapi-schemas';

/**
 * 统一响应工具类
 * 所有API响应都使用 {code, data, msg} 格式
 */
export class ResponseUtils {
	/**
	 * 创建成功响应
	 */
	static success<T = any>(data?: T, msg = '操作成功'): Response {
		return new Response(
			JSON.stringify({
				code: ResponseCodes.SUCCESS,
				msg,
				data,
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
			}
		);
	}

	/**
	 * 创建错误响应
	 */
	static error(code: number, msg: string, data?: any): Response {
		return new Response(
			JSON.stringify({
				code,
				msg,
				data,
			}),
			{
				status: code >= 500 ? 500 : code,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
			}
		);
	}

	/**
	 * 创建JSON响应 (for Hono Context)
	 */
	static json<T = any>(c: any, data?: T, msg = '操作成功', code: number = ResponseCodes.SUCCESS, httpStatus?: number): Response {
		return c.json(
			{
				code,
				msg,
				data,
			},
			httpStatus || (code === ResponseCodes.SUCCESS ? 200 : code >= 500 ? 500 : code)
		);
	}

	/**
	 * 快捷方法：无效参数
	 */
	static invalidParams(msg = '请求参数错误', data?: any): Response {
		return ResponseUtils.error(ResponseCodes.INVALID_PARAMS, msg, data);
	}

	/**
	 * 快捷方法：未授权
	 */
	static unauthorized(msg = '未授权访问', data?: any): Response {
		return ResponseUtils.error(ResponseCodes.UNAUTHORIZED, msg, data);
	}

	/**
	 * 快捷方法：禁止访问
	 */
	static forbidden(msg = '禁止访问', data?: any): Response {
		return ResponseUtils.error(ResponseCodes.FORBIDDEN, msg, data);
	}

	/**
	 * 快捷方法：未找到
	 */
	static notFound(msg = '资源未找到', data?: any): Response {
		return ResponseUtils.error(ResponseCodes.NOT_FOUND, msg, data);
	}

	/**
	 * 快捷方法：冲突
	 */
	static conflict(msg = '资源冲突', data?: any): Response {
		return ResponseUtils.error(ResponseCodes.CONFLICT, msg, data);
	}

	/**
	 * 快捷方法：服务器内部错误
	 */
	static internalError(msg = '服务器内部错误', data?: any): Response {
		return ResponseUtils.error(ResponseCodes.INTERNAL_ERROR, msg, data);
	}

	/**
	 * Hono Context 快捷方法：成功响应
	 */
	static jsonSuccess<T = any>(c: any, data?: T, msg = '操作成功'): Response {
		return ResponseUtils.json(c, data, msg, ResponseCodes.SUCCESS);
	}

	/**
	 * Hono Context 快捷方法：错误响应
	 */
	static jsonError(c: any, code: number, msg: string, data?: any): Response {
		return ResponseUtils.json(c, data, msg, code);
	}
} 