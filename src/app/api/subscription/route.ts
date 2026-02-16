import { NextRequest, NextResponse } from 'next/server';
import { AuthUtils } from '@/utils/authUtils';
import { ResponseUtils } from '@/utils/responseUtils';
import { ClashHandler } from '@/lib/clashHandler';

export async function GET(request: NextRequest) {
  const env = process.env as unknown as Env;
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

    if (!authConfig.subscribe) {
      return NextResponse.json({
        error: 'Missing subscription configuration',
        message: '用户配置中缺少订阅URL',
        code: 'MISSING_SUBSCRIPTION'
      }, { status: 400 });
    }

    const clashHandler = new ClashHandler();
    const response = await clashHandler.handle(request as unknown as Request, env as unknown as Env, { userConfig: authConfig });

    if (!response) {
      return NextResponse.json({
        error: 'Clash handler failed',
        message: '配置生成失败',
        code: 'CLASH_HANDLER_FAILED'
      }, { status: 500 });
    }

    // Return the response directly as it's already a standard Response object
    return response;
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}
