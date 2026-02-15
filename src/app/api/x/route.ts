import { NextRequest, NextResponse } from 'next/server';
import { AuthUtils } from '@/utils/authUtils';
import { ClashHandler } from '@/lib/clashHandler';
import { InnerUser } from '@/module/userManager/innerUserConfig';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { env } = getRequestContext<Env & Record<string, unknown>>();
  const searchParams = request.nextUrl.searchParams;
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({ 
      error: 'Missing uid',
      message: '缺少用户ID',
      code: 'MISSING_UID'
    }, { status: 400 });
  }

  try {
    // AuthUtils expects a Request and Env.
    const authConfig = await AuthUtils.authenticate(request as unknown as Request, env as unknown as Env, uid);
    const innerUser = new InnerUser(authConfig.config);

    if (!innerUser.subscribe) {
       return NextResponse.json({ 
         error: 'Missing subscription configuration',
         message: '用户配置中缺少订阅URL',
         code: 'MISSING_SUBSCRIPTION'
       }, { status: 400 });
    }

    const clashHandler = new ClashHandler();
    const response = await clashHandler.handle(request as unknown as Request, env as unknown as Env, { innerUser });

    if (!response) {
      return NextResponse.json({ 
        error: 'Clash handler failed',
        message: '配置生成失败',
        code: 'CLASH_HANDLER_FAILED'
      }, { status: 500 });
    }

    // Return the response directly as it's already a standard Response object
    return response;
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('no access token') || errorMessage.includes('Invalid access token')) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: '用户认证失败',
        code: 'AUTH_FAILED',
      }, { status: 401 });
    }

    return NextResponse.json({
      error: 'Internal Server Error',
      message: '服务器内部错误',
      detail: errorMessage,
      code: 'INTERNAL_ERROR',
    }, { status: 500 });
  }
}
