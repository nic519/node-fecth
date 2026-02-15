import { NextRequest, NextResponse } from 'next/server';
import { SuperAdminManager } from '@/module/userManager/superAdminManager';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { env } = getRequestContext() as unknown as { env: Env };
  const { uid } = await params;
  const searchParams = request.nextUrl.searchParams;
  const superToken = searchParams.get('superToken');
  
  if (!superToken || superToken !== env.SUPER_ADMIN_TOKEN) {
    return NextResponse.json({ code: 401, msg: 'Unauthorized' }, { status: 401 });
  }

  try {
    const manager = new SuperAdminManager(env);
    await manager.deleteUser(uid, 'admin');
    
    return NextResponse.json({
      code: 0,
      msg: 'success'
    });
  } catch (error) {
    return NextResponse.json({ code: 500, msg: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}
