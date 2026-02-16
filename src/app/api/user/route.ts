import { NextRequest, NextResponse } from 'next/server';
import { UserManager } from '@/module/userManager/userManager';
import { ResponseUtils } from '@/utils/responseUtils';
import { UserConfig } from '@/types/openapi-schemas';
import { AuthUtils } from '@/utils/authUtils';

// GET: 获取用户配置
export async function GET(request: NextRequest) {
  const env = process.env as unknown as Env;
  const searchParams = request.nextUrl.searchParams;
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({
      code: 400,
      msg: 'Missing uid',
    }, { status: 400 });
  }

  try {
    // 使用统一认证：支持 User Token 或 Super Admin Token
    const userConfig = await AuthUtils.authenticate(request, env, uid);

    return NextResponse.json({
      code: 0,
      msg: 'success',
      data: userConfig,
    });
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}

// PUT: 更新用户配置
export async function PUT(request: NextRequest) {
  const env = process.env as unknown as Env;
  const searchParams = request.nextUrl.searchParams;
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({
      code: 400,
      msg: 'Missing uid',
    }, { status: 400 });
  }

  try {
    // 使用统一认证
    await AuthUtils.authenticate(request, env, uid);

    const userManager = new UserManager(env);
    const body = await request.json() as { config: UserConfig };

    // 更新配置
    // 注意：这里需要根据实际的 UserManager.updateUserConfig 接口调整
    // 假设 body 是部分更新
    // 如果 UserManager.updateUser 还没实现，这里可能会报错。
    // 根据上下文，可能需要使用 userManager.saveUserConfig
    const updatedUser = await userManager.saveUserConfig(uid, body.config);

    if (!updatedUser) {
      throw new Error('Update failed');
    }

    // 重新获取以返回最新数据
    const newUser = await userManager.getUserConfig(uid);

    return NextResponse.json({
      code: 0,
      msg: 'success',
      data: newUser,
    });
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}
