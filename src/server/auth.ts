import 'server-only';

import { AuthenticatedUserConfig } from '@/types/api-schemas';
import { UserService } from '@/modules/user/user.service';
import { getServerDb } from '@/server/db';

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

export async function authenticateUserConfig(
  request: Request,
  uid: string,
  explicitEnv?: Env,
): Promise<AuthenticatedUserConfig> {
  const accessToken = getAccessTokenFromRequest(request);
  if (!accessToken) {
    throw new Error('no access token');
  }

  const userService = new UserService(getServerDb(explicitEnv));
  const user = await userService.validateAndGetUser(uid, accessToken);
  if (!user) {
    throw new Error('Invalid access token');
  }

  return user;
}
