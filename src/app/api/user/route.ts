import { NextResponse } from 'next/server';
import { UserManager } from '@/module/userManager/userManager';
import { ResponseUtils } from '@/utils/responseUtils';
import { UserConfig } from '@/types/openapi-schemas';
import { withAuth } from '@/utils/apiMiddleware';

// GET: 获取用户配置
export const GET = withAuth(async (request) => {
  return NextResponse.json({
    code: 0,
    msg: 'success',
    data: request.auth,
  });
}, { authenticateUser: true });

// PUT: 更新用户配置
export const PUT = withAuth(async (request) => {
  const env = process.env as unknown as Env;
  const uid = request.uid!;

  try {
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
}, { authenticateUser: true });
