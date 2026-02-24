/* eslint-disable @typescript-eslint/no-explicit-any */
import { CORS_HEADERS } from '@/config/cors';
import { ResponseCodes, type ResponseCode } from '@/types/openapi-schemas';
import { BaseResponseSchema } from '@/types/schema.base';
import { safeError } from '@/utils/logHelper';

export { CORS_HEADERS };

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
				...CORS_HEADERS,
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
				...CORS_HEADERS,
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
	 * 统一处理 API 错误
	 */
	static handleApiError(error: unknown): Response {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('API Error:', safeError(error));

		let code: ResponseCode = ResponseCodes.INTERNAL_ERROR;

		if (errorMessage.includes('Unauthorized') || errorMessage.includes('token') || errorMessage.includes('认证失败')) {
			code = ResponseCodes.UNAUTHORIZED;
		} else if (errorMessage.includes('Missing') || errorMessage.includes('缺少') || errorMessage.includes('无效')) {
			code = ResponseCodes.INVALID_PARAMS;
		}

		return this.error(code, errorMessage);
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
	 * 创建标准响应头
	 */
	static createHeaders(contentType: string = 'application/json', extraHeaders: Record<string, string> = {}): Headers {
		const headers = new Headers(CORS_HEADERS);
		headers.set('Content-Type', contentType);
		Object.entries(extraHeaders).forEach(([key, value]) => {
			headers.set(key, value);
		});
		return headers;
	}

	/**
	 * 创建原始文本响应 (支持自定义 Content-Type)
	 */
	static raw(content: string, contentType: string = 'text/plain; charset=utf-8', status: number = 200, extraHeaders: Record<string, string> = {}): Response {
		return new Response(content, {
			status,
			headers: this.createHeaders(contentType, extraHeaders),
		});
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
