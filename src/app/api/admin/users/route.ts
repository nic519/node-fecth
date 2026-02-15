import { NextRequest, NextResponse } from 'next/server';
import { SuperAdminManager } from '@/module/userManager/superAdminManager';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { env } = getRequestContext() as unknown as { env: Env };
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
  } catch (error) {
    return NextResponse.json({ code: 500, msg: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { env } = getRequestContext() as unknown as { env: Env };
  const searchParams = request.nextUrl.searchParams;
  const superToken = searchParams.get('superToken');

  if (!superToken || superToken !== env.SUPER_ADMIN_TOKEN) {
    return NextResponse.json({ code: 401, msg: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json() as any;
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
  } catch (error) {
    return NextResponse.json({ code: 500, msg: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}
