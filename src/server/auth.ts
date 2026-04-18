import 'server-only';

import { ConfigResponse } from '@/types/openapi-schemas';
import { SUPER_TOKEN_QUERY_PARAM } from '@/config/constants';
import { UserService } from '@/modules/user/user.service';
import { getServerDb } from '@/server/db';
import { getSuperAdminToken } from '@/server/runtime';

export function getAccessTokenFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  const tokenFromQuery = url.searchParams.get('token');
  if (tokenFromQuery) {
    return tokenFromQuery;
  }

  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

export function isValidSuperAdminTokenValue(
  superToken: string | null | undefined,
  explicitEnv?: Env,
): boolean {
  const expectedToken = getSuperAdminToken(explicitEnv);
  return Boolean(superToken && expectedToken && superToken === expectedToken);
}

export function isSuperAdminRequest(request: Request, explicitEnv?: Env): boolean {
  const url = new URL(request.url);
  const superToken = url.searchParams.get(SUPER_TOKEN_QUERY_PARAM);
  return isValidSuperAdminTokenValue(superToken, explicitEnv);
}

export async function authenticateUserConfig(
  request: Request,
  uid: string,
  explicitEnv?: Env,
): Promise<ConfigResponse> {
  const userService = new UserService(getServerDb(explicitEnv));

  if (isSuperAdminRequest(request, explicitEnv)) {
    const user = await userService.getUserConfig(uid);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  const accessToken = getAccessTokenFromRequest(request);
  if (!accessToken) {
    throw new Error('no access token');
  }

  const user = await userService.validateAndGetUser(uid, accessToken);
  if (!user) {
    throw new Error('Invalid access token');
  }

  return user;
}
