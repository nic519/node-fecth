import { ConfigResponse } from '@/types/openapi-schemas';
import { UserService } from '@/modules/user/user.service';
import { getDb, getRuntimeEnv } from '@/db';
import { SUPER_TOKEN_QUERY_PARAM } from '@/config/constants';

export class AuthTokenUtils {
	static getAccessTokenFromRequest(request: Request): string | null {
		const url = new URL(request.url);
		const tokenFromQuery = url.searchParams.get('token');
		if (tokenFromQuery) return tokenFromQuery;

		const authHeader = request.headers.get('Authorization');
		if (authHeader && authHeader.startsWith('Bearer ')) {
			return authHeader.substring(7);
		}

		return null;
	}

	static getSuperAdminToken(env?: Env): string | undefined {
		const runtimeEnv = getRuntimeEnv(env);
		return runtimeEnv?.SUPER_ADMIN_TOKEN;
	}

	static isValidSuperAdminTokenValue(superToken: string | null | undefined, env?: Env): boolean {
		const envSuperToken = this.getSuperAdminToken(env);
		return !!(superToken && envSuperToken && superToken === envSuperToken);
	}

	static isSuperAdminRequest(request: Request, env?: Env): boolean {
		const url = new URL(request.url);
		const superToken = url.searchParams.get(SUPER_TOKEN_QUERY_PARAM);
		return this.isValidSuperAdminTokenValue(superToken, env);
	}
}

export class AuthService {
	static async authenticateUserConfig(request: Request, env: Env | undefined, uid: string): Promise<ConfigResponse> {
		const db = getDb(env);
		const userService = new UserService(db);

		if (AuthTokenUtils.isSuperAdminRequest(request, env)) {
			const user = await userService.getUserConfig(uid);
			if (!user) {
				throw new Error('User not found');
			}
			return user;
		}

		const accessToken = AuthTokenUtils.getAccessTokenFromRequest(request);
		if (!accessToken) {
			throw Error('no access token');
		}

		const user = await userService.validateAndGetUser(uid, accessToken);
		if (!user) {
			throw Error('Invalid access token');
		}
		return user;
	}
}
