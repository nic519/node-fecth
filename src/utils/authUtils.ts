import { getUserConfig, DBUser } from '@/types/user.types';

export class AuthUtils {
	/**
	 * 验证token
	 * @param uid 用户id
	 * @param token 访问token
	 * @param env 环境变量
	 * @returns 用户配置或401响应
	 */
	static validateToken(uid: string | null, token: string | null, env: Env): DBUser | Response {
		if (!uid || !token) {
			return new Response('Unauthorized 缺少参数: uid 或 token', { status: 401 });
		}
		const userConfig = getUserConfig(env, uid);
		if (!userConfig || token !== userConfig.accessToken) {
			return new Response('Unauthorized', { status: 401 });
		}
		return userConfig;
	}
}
