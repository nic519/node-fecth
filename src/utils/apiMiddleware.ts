import { AuthenticatedUserConfig } from '@/types/api-schemas';
import { authenticateUserConfig } from '@/server/auth';
import { adminSessionCookie, isCrossOriginAdminWrite, isValidAdminSession } from '@/server/admin-session';
import { ResponseUtils } from '@/utils/responseUtils';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedRequest extends NextRequest {
  auth?: AuthenticatedUserConfig;
  uid?: string;
}

type ApiHandler = (
  req: AuthenticatedRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse | Response> | NextResponse | Response;

interface AuthOptions {
  /**
   * Require a signed admin session.
   */
  adminOnly?: boolean;
  /**
   * List of required query parameters
   */
  requiredParams?: string[];
  /**
   * Perform user authentication and populate AuthenticatedUserConfig
   */
  authenticateUser?: boolean;
}

export function withAuth(handler: ApiHandler, options: AuthOptions = {}) {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    const searchParams = request.nextUrl.searchParams;
    const respond = (response: Response) => {
      if (options.adminOnly) response.headers.set('Cache-Control', 'private, no-store');
      return response;
    };

    try {
      // 1. Admin Check
      if (options.adminOnly) {
        if (isCrossOriginAdminWrite(request)) {
          return respond(ResponseUtils.error(403, '不允许跨站操作。'));
        }
        if (!isValidAdminSession(request.cookies.get(adminSessionCookie)?.value)) {
          return respond(ResponseUtils.error(401, '请先登录管理后台。'));
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

        const userConfig = await authenticateUserConfig(request, uid);
        (request as AuthenticatedRequest).auth = userConfig;
        (request as AuthenticatedRequest).uid = uid;
      }

      return respond(await handler(request as AuthenticatedRequest, context));
    } catch (error: unknown) {
      return respond(ResponseUtils.handleApiError(error));
    }
  };
}
