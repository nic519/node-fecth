import { ConfigResponse } from '@/types/openapi-schemas';
import { getRuntimeEnv } from '@/db';
import { AuthService, AuthTokenUtils } from '@/utils/authUtils';
import { ResponseUtils } from '@/utils/responseUtils';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedRequest extends NextRequest {
  auth?: ConfigResponse;
  uid?: string;
}

type ApiHandler = (
  req: AuthenticatedRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse | Response> | NextResponse | Response;

interface AuthOptions {
  /**
   * Only allow Super Admin (checks superToken against env)
   */
  adminOnly?: boolean;
  /**
   * List of required query parameters
   */
  requiredParams?: string[];
  /**
   * Perform user authentication and populate ConfigResponse
   */
  authenticateUser?: boolean;
}

export function withAuth(handler: ApiHandler, options: AuthOptions = {}) {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    const env = getRuntimeEnv();
    const searchParams = request.nextUrl.searchParams;

    try {
      // 1. Admin Check
      if (options.adminOnly) {
        if (!AuthTokenUtils.isSuperAdminRequest(request, env)) {
          return ResponseUtils.error(401, 'Unauthorized');
        }
      }

      // 2. Required Params Check
      if (options.requiredParams) {
        for (const param of options.requiredParams) {
          if (!searchParams.get(param)) {
            return ResponseUtils.error(400, `Missing ${param}`);
          }
        }
      }

      // 3. User Authentication
      if (options.authenticateUser) {
        // Typically requires 'uid' to fetch config
        const uid = searchParams.get('uid');
        if (!uid) {
          return ResponseUtils.error(400, 'Missing uid');
        }

        const userConfig = await AuthService.authenticateUserConfig(request, env, uid);
        (request as AuthenticatedRequest).auth = userConfig;
        (request as AuthenticatedRequest).uid = uid;
      }

      return await handler(request as AuthenticatedRequest, context);
    } catch (error: unknown) {
      return ResponseUtils.handleApiError(error);
    }
  };
}
