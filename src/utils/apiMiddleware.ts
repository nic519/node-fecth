import { NextRequest, NextResponse } from 'next/server';
import { AuthUtils } from '@/utils/authUtils';
import { ResponseUtils } from '@/utils/responseUtils';
import { ConfigResponse } from '@/types/openapi-schemas';

export interface AuthenticatedRequest extends NextRequest {
  auth?: ConfigResponse;
  uid?: string;
}

type ApiHandler = (
  req: AuthenticatedRequest,
  context: { params: Promise<any> }
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
   * Perform user authentication using AuthUtils.authenticate
   * If true, req.auth will be populated with ConfigResponse
   */
  authenticateUser?: boolean;
}

export function withAuth(handler: ApiHandler, options: AuthOptions = {}) {
  return async (request: NextRequest, context: { params: Promise<any> }) => {
    const env = process.env as unknown as Env;
    const searchParams = request.nextUrl.searchParams;

    try {
      // 1. Admin Check
      if (options.adminOnly) {
        const superToken = searchParams.get('superToken');
        const envSuperToken = process.env.SUPER_ADMIN_TOKEN || env.SUPER_ADMIN_TOKEN;

        if (!superToken || !envSuperToken || superToken !== envSuperToken) {
          return NextResponse.json({ code: 401, msg: 'Unauthorized' }, { status: 401 });
        }
      }

      // 2. Required Params Check
      if (options.requiredParams) {
        for (const param of options.requiredParams) {
          if (!searchParams.get(param)) {
            return NextResponse.json({
              code: 400,
              msg: `Missing ${param}`
            }, { status: 400 });
          }
        }
      }

      // 3. User Authentication
      if (options.authenticateUser) {
        // Typically requires 'uid' to fetch config
        const uid = searchParams.get('uid');
        if (!uid) {
          return NextResponse.json({ code: 400, msg: 'Missing uid' }, { status: 400 });
        }

        const userConfig = await AuthUtils.authenticate(request, env, uid);
        (request as AuthenticatedRequest).auth = userConfig;
        (request as AuthenticatedRequest).uid = uid;
      }

      return await handler(request as AuthenticatedRequest, context);
    } catch (error: unknown) {
      return ResponseUtils.handleApiError(error);
    }
  };
}
