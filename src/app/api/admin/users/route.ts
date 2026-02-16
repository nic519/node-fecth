import { NextRequest, NextResponse } from 'next/server';
import { SuperAdminManager } from '@/module/userManager/superAdminManager';
import { UserConfig } from '@/types/openapi-schemas';

export async function GET(request: NextRequest) {
  const env = process.env as unknown as Env;
  const searchParams = request.nextUrl.searchParams;
  const superToken = searchParams.get('superToken');

  if (!superToken || superToken !== env.SUPER_ADMIN_TOKEN) {
    return NextResponse.json({ code: 401, msg: 'Unauthorized' }, { status: 401 });
  }

  try {
    const manager = new SuperAdminManager(env);
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
}

export async function POST(request: NextRequest) {
  const env = process.env as unknown as Env;
  const searchParams = request.nextUrl.searchParams;
  const superToken = searchParams.get('superToken');

  if (!superToken || superToken !== env.SUPER_ADMIN_TOKEN) {
    return NextResponse.json({ code: 401, msg: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json() as { uid: string; config: UserConfig };
    const { uid, config } = body;

    if (!uid || !config) {
      return NextResponse.json({ code: 400, msg: 'Missing uid or config' }, { status: 400 });
    }

    const manager = new SuperAdminManager(env);
    await manager.createUser(uid, config, 'admin');

    return NextResponse.json({
      code: 0,
      msg: 'success'
    });
  } catch (error: unknown) {
    return NextResponse.json({ code: 500, msg: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}
