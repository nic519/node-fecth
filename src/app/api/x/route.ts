import { NextRequest, NextResponse } from 'next/server';
import { AuthUtils } from '@/utils/authUtils';
import { ResponseUtils } from '@/utils/responseUtils';
import { ClashHandler } from '@/lib/clashHandler';
import { InnerUser } from '@/module/userManager/innerUserConfig';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { env } = getRequestContext<Env & Record<string, unknown>>();
  const searchParams = request.nextUrl.searchParams;
  const uid = searchParams.get('uid');

  if (!uid) {
    return ResponseUtils.error(400, '缺少用户ID');
  }

  try {
    // AuthUtils expects a Request and Env.
    const authConfig = await AuthUtils.authenticate(request as unknown as Request, env as unknown as Env, uid);
    const innerUser = new InnerUser(authConfig.config);

    if (!innerUser.subscribe) {
      return ResponseUtils.error(400, '用户配置中缺少订阅URL');
    }

    const clashHandler = new ClashHandler();
    const response = await clashHandler.handle(request as unknown as Request, env as unknown as Env, { innerUser });

    if (!response) {
      return ResponseUtils.error(500, '配置生成失败');
    }

    // Return the response directly as it's already a standard Response object
    return response;
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}
