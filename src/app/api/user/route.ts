import { NextRequest, NextResponse } from 'next/server';
import { AuthUtils } from '@/utils/authUtils';
import { UserManager } from '@/module/userManager/userManager';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/db';

export const runtime = 'edge';

// GET: 获取用户配置
export async function GET(request: NextRequest) {
  const { env } = getRequestContext() as unknown as { env: Env };
  const searchParams = request.nextUrl.searchParams;
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  if (!uid || !token) {
    return NextResponse.json({
      code: 400,
      msg: 'Missing uid or token',
    }, { status: 400 });
  }

  try {
    const db = getDb(env);
    const userManager = new UserManager(env);
    
    // 验证用户并获取配置
    const userConfig = await userManager.getUserConfig(uid);
    
    if (!userConfig) {
      return NextResponse.json({
        code: 404,
        msg: 'User not found',
      }, { status: 404 });
    }

    if (userConfig.config.accessToken !== token) {
      return NextResponse.json({
        code: 401,
        msg: 'Invalid token',
      }, { status: 401 });
    }

    return NextResponse.json({
      code: 0,
      msg: 'success',
      data: userConfig,
    });
  } catch (error) {
    console.error('Error fetching user config:', error);
    return NextResponse.json({
      code: 500,
      msg: 'Internal Server Error',
    }, { status: 500 });
  }
}

// PUT: 更新用户配置
export async function PUT(request: NextRequest) {
  const { env } = getRequestContext() as unknown as { env: Env };
  const searchParams = request.nextUrl.searchParams;
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  if (!uid || !token) {
    return NextResponse.json({
      code: 400,
      msg: 'Missing uid or token',
    }, { status: 400 });
  }

  try {
    const db = getDb(env);
    const userManager = new UserManager(env);
    
    // 验证用户
    const currentUser = await userManager.getUserConfig(uid);
    
    if (!currentUser) {
      return NextResponse.json({
        code: 404,
        msg: 'User not found',
      }, { status: 404 });
    }

    if (currentUser.config.accessToken !== token) {
      return NextResponse.json({
        code: 401,
        msg: 'Invalid token',
      }, { status: 401 });
    }

    const body = await request.json() as any;
    
    // 更新配置
    // 注意：这里需要根据实际的 UserManager.updateUserConfig 接口调整
    // 假设 body 是部分更新
    const updatedUser = await userManager.updateUser(uid, body);

    return NextResponse.json({
      code: 0,
      msg: 'success',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user config:', error);
    return NextResponse.json({
      code: 500,
      msg: 'Internal Server Error',
    }, { status: 500 });
  }
}
