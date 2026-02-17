import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/modules/user/admin.service';
import { getDb } from '@/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const env = process.env as unknown as Env;
  const { uid } = await params;
  const searchParams = request.nextUrl.searchParams;
  const superToken = searchParams.get('superToken');

  if (!superToken || superToken !== env.SUPER_ADMIN_TOKEN) {
    return NextResponse.json({ code: 401, msg: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb(env);
    const manager = new AdminService(db, env.USERS_KV, env.SUPER_ADMIN_TOKEN);
    await manager.deleteUser(uid, 'admin');

    return NextResponse.json({
      code: 0,
      msg: 'success'
    });
  } catch (error) {
    return NextResponse.json({ code: 500, msg: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}
