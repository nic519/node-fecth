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
	 * 验证 Super Admin Token
	 */
	static validateSuperToken(request: Request, env: Env): boolean {
		const url = new URL(request.url);
		const superToken = url.searchParams.get('superToken');
		// 注意：OpenNext 中 process.env.SUPER_ADMIN_TOKEN 优于 env.SUPER_ADMIN_TOKEN
		const envSuperToken = process.env.SUPER_ADMIN_TOKEN || env.SUPER_ADMIN_TOKEN;

		return !!(superToken && envSuperToken && superToken === envSuperToken);
	}

	/**
	 * 统一的身份验证方法
	 * 支持 User Token 和 Super Admin Token
	 * @param request HTTP请求对象
	 * @param env 环境变量
	 * @param uid 可选的用户ID，如果不提供则只验证令牌存在
	 * @returns 验证结果
	 */
	static async authenticate(request: Request, env: Env, uid?: string): Promise<ConfigResponse> {
		const accessToken = this.getAccessToken(request);

		// 1. 优先检查 Super Admin Token
		if (this.validateSuperToken(request, env)) {
			// 如果是超级管理员，且提供了 uid，则直接获取用户信息并返回
			if (uid) {
				const userManager = new UserManager(env);
				const user = await userManager.getUserConfig(uid);
				if (!user) {
					// 虽然是管理员，但用户不存在
					throw new Error('User not found');
				}
				return user;
			}
			// 如果没有提供 uid，这里暂时无法返回 ConfigResponse，抛出错误或需要调整返回类型
			// 但目前的用法 authenticate 通常都带 uid。
			throw new Error('No user id provided for super admin');
		}

		// 2. 验证普通 User Access Token
		if (!accessToken) {
			throw Error('no access token');
		}

		const userManager = new UserManager(env);

		// 如果提供了uid，验证用户权限
		if (uid) {
			const user = await userManager.validateAndGetUser(uid, accessToken);
			if (!user) {
				throw Error('Invalid access token');
			}
			return user;
		}
		throw Error('No user id');
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
	static createSuccessResponse(data: unknown, contentType: string = 'application/json'): Response {
		const body = contentType === 'application/json' ? JSON.stringify(data) : String(data);

		return new Response(body, {
			status: 200,
			headers: this.getCorsHeaders(contentType),
		});
	}
}
