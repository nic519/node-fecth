import { parse as yamlParse } from 'yaml';

export class AuthUtils {
	/**
	 * 验证token
	 * @param env 环境变量
	 * @param uid 用户id
	 * @param token 访问token
	 * @returns 用户配置或401响应
	 */
	static validateToken(env: Env, uid?: string, token?: string): any | Response {
		if (!uid || !token) {
			return new Response('Unauthorized 缺少参数: uid 或 token', { status: 401 });
		}

		try {
			const dbUser = env.DB_USER;
			if (!dbUser) {
				return new Response('Unauthorized: No user configuration found', { status: 401 });
			}

			const users = yamlParse(dbUser) as Record<string, any>;
			const userConfig = users[uid];

			if (!userConfig || token !== userConfig.accessToken) {
				return new Response('Unauthorized', { status: 401 });
			}

			return userConfig;
		} catch (error) {
			console.error('Token validation error:', error);
			return new Response('Unauthorized: Invalid configuration', { status: 401 });
		}
	}
}
