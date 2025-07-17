import { Base64Utils } from './base64Utils';
import { ConfigResponse } from '@/types/openapi-schemas';
import { UserManager } from '@/module/userManager/userManager';

/**
 * 统一的身份验证工具类
 */
export class AuthUtils {
	/**
	 * 从请求中提取访问令牌
	 * 支持从查询参数（token）和 Authorization 头部获取
	 */
	static getAccessToken(request: Request): string | null {
		// 从查询参数获取
		const url = new URL(request.url);
		const tokenFromQuery = url.searchParams.get('token');
		if (tokenFromQuery) return tokenFromQuery;

		// 从Authorization头获取
		const authHeader = request.headers.get('Authorization');
		if (authHeader && authHeader.startsWith('Bearer ')) {
			return authHeader.substring(7);
		}

		return null;
	}

	/**
	 * 统一的身份验证方法
	 * @param request HTTP请求对象
	 * @param env 环境变量
	 * @param uid 可选的用户ID，如果不提供则只验证令牌存在
	 * @returns 验证结果
	 */
	static async authenticate(request: Request, env: Env, uid?: string): Promise<ConfigResponse> {
		// 验证访问令牌
		const accessToken = this.getAccessToken(request);
		if (!accessToken) {
			throw Error('no access token');
		}

		const userManager = new UserManager(env);

		// 如果提供了uid，验证用户权限
		if (uid) {
			const user = await userManager.validateAndGetUser(uid, accessToken);
			if (!user) {
				throw Error(' Invalid access token');
			}
			return user;
		}
		throw Error(' No user id');
	}

	/**
	 * 生成标准的CORS响应头
	 */
	static getCorsHeaders(contentType: string = 'application/json'): HeadersInit {
		return {
			'Content-Type': contentType,
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};
	}

	/**
	 * 创建统一的错误响应
	 */
	static createErrorResponse(message: string, status: number, contentType: string = 'application/json'): Response {
		const body = JSON.stringify({ message: message });

		return new Response(body, {
			status,
			headers: this.getCorsHeaders(contentType),
		});
	}

	/**
	 * 创建统一的成功响应
	 */
	static createSuccessResponse(data: any, contentType: string = 'application/json'): Response {
		const body = contentType === 'application/json' ? JSON.stringify(data) : data;

		return new Response(body, {
			status: 200,
			headers: this.getCorsHeaders(contentType),
		});
	}
}
