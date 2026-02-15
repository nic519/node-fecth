import { BaseResponseSchema } from '@/types/schema.base';
import { ResponseCodes } from '@/types/openapi-schemas';

/**
 * 统一响应工具类
 * 所有API响应都使用 {code, data, msg} 格式
 * 基于 openapi-schemas.ts 中定义的Schema，遵循单一数据源原则
 */
export class ResponseUtils {
	/**
	 * 创建成功响应
	 */
	static success<T = any>(data?: T, msg = '操作成功'): Response {
		const responseData = {
			code: ResponseCodes.SUCCESS,
			msg,
			data,
		};

		return new Response(JSON.stringify(responseData), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
		});
	}

	/**
	 * 创建错误响应
	 */
	static error(code: number, msg: string, data: any = null): Response {
		const responseData = {
			code,
			msg,
			data,
		};

		const statusCode = code >= 400 ? code : 500;
		return new Response(JSON.stringify(responseData), {
			status: statusCode,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
		});
	}

	/**
	 * 通用JSON响应创建器
	 */
	static json<T = any>(c: any, data: T, msg: string, code: number = ResponseCodes.SUCCESS, statusCode: number = 200): Response {
		const responseData = {
			code,
			msg,
			data,
		};

		return c.json(responseData, statusCode);
	}

	/**
	 * 错误响应快捷方法
	 */
	static jsonError(c: any, code: number, msg: string, data: any = null): Response {
		return this.json(c, data, msg, code, code >= 400 ? code : 500);
	}

	/**
	 * 验证响应是否符合标准格式
	 * 使用 openapi-schemas.ts 中定义的 BaseResponseSchema
	 */
	static validateResponse(response: any): boolean {
		try {
			BaseResponseSchema.parse(response);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * 类型守卫：检查是否为成功响应
	 * 基于 openapi-schemas.ts 中的 SuccessResponseSchema
	 */
	static isSuccessResponse(response: any): response is { code: 0; msg: string; data: any } {
		return BaseResponseSchema.safeParse(response).success;
	}

	/**
	 * 类型守卫：检查是否为错误响应
	 * 基于 openapi-schemas.ts 中的 ErrorResponseSchema
	 */
	static isErrorResponse(response: any): response is { code: number; msg: string; data: any } {
		return BaseResponseSchema.safeParse(response).success;
	}
}
