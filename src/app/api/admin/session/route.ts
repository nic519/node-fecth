import { NextResponse } from 'next/server';
import {
  adminSessionCookie,
  adminSessionSeconds,
  createAdminSession,
  isCrossOriginAdminWrite,
  matchesAdminPassword,
} from '@/server/admin-session';
import { getSuperAdminToken } from '@/server/runtime';

const headers = { 'Cache-Control': 'no-store' };

function sessionResponse(value: string, maxAge: number) {
  const response = NextResponse.json({ ok: true }, { headers });
  response.cookies.set(adminSessionCookie, value, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  });
  return response;
}

export async function POST(request: Request) {
  if (isCrossOriginAdminWrite(request)) {
    return NextResponse.json({ error: '不允许跨站操作。' }, { status: 403, headers });
  }

  const password = getSuperAdminToken();
  if (!password) {
    return NextResponse.json({ error: '服务端尚未配置管理员密码。' }, { status: 503, headers });
  }

  const data = await request.json().catch(() => null);
  if (typeof data?.password !== 'string' || !matchesAdminPassword(data.password, password)) {
    return NextResponse.json({ error: '管理员密码不正确。' }, { status: 401, headers });
  }

  return sessionResponse(createAdminSession(password), adminSessionSeconds);
}

export function DELETE(request: Request) {
  if (isCrossOriginAdminWrite(request)) {
    return NextResponse.json({ error: '不允许跨站操作。' }, { status: 403, headers });
  }

  return sessionResponse('', 0);
}
