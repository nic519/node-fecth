import { NextResponse } from 'next/server';
import { AdminService } from '@/modules/user/admin.service';
import { UserConfig } from '@/types/openapi-schemas';
import { withAuth } from '@/utils/apiMiddleware';
import { getDb } from '@/db';

/// 获取所有用户信息
export const GET = withAuth(async () => {
  const env = process.env as unknown as Env;

  try {
    const db = getDb(env);
    // Note: Assuming env.USERS_KV is available on process.env or global env
    const manager = new AdminService(db, env.SUPER_ADMIN_TOKEN);
    const users = await manager.getUserSummaryList();

    return NextResponse.json({
      code: 0,
      msg: 'success',
      data: {
        users: users
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ code: 500, msg: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}, { adminOnly: true });

/// 创建新用户
export const POST = withAuth(async (request) => {
  const env = process.env as unknown as Env;

  try {
    const body = await request.json() as { uid: string; config: UserConfig };
    const { uid, config } = body;

    if (!uid || !config) {
      return NextResponse.json({ code: 400, msg: 'Missing uid or config' }, { status: 400 });
    }

    const db = getDb(env);
    const manager = new AdminService(db, env.SUPER_ADMIN_TOKEN);
    await manager.createUser(uid, config, 'admin'); // 'admin' is hardcoded adminId for now

    return NextResponse.json({
      code: 0,
      msg: 'success'
    });
  } catch (error: unknown) {
    return NextResponse.json({ code: 500, msg: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}, { adminOnly: true });
