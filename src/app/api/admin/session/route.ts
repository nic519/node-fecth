import { createLogService } from '@/services/log-service';
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

async function logSession(result: string, stage: 'login' | 'logout') {
  try {
    createLogService().record({
      level: result === 'success' ? 'audit' : 'warn',
      type: stage === 'login' ? 'user_login' : 'user_logout',
      message: stage === 'login' ? '管理员登录' : '管理员退出',
      meta: { actorId: 'admin', result, stage },
    });
  } catch {
    console.error('管理员会话日志写入失败');
  }
}

export async function POST(request: Request) {
  if (isCrossOriginAdminWrite(request)) {
    await logSession('rejected', 'login');
    return NextResponse.json({ error: '不允许跨站操作。' }, { status: 403, headers });
  }

  const password = getSuperAdminToken();
  if (!password) {
    await logSession('rejected', 'login');
    return NextResponse.json({ error: '服务端尚未配置管理员密码。' }, { status: 503, headers });
  }

  const data = await request.json().catch(() => null);
  if (typeof data?.password !== 'string' || !matchesAdminPassword(data.password, password)) {
    await logSession('rejected', 'login');
    return NextResponse.json({ error: '管理员密码不正确。' }, { status: 401, headers });
  }

  const response = sessionResponse(createAdminSession(password), adminSessionSeconds);
  await logSession('success', 'login');
  return response;
}

export async function DELETE(request: Request) {
  if (isCrossOriginAdminWrite(request)) {
    await logSession('rejected', 'logout');
    return NextResponse.json({ error: '不允许跨站操作。' }, { status: 403, headers });
  }

  await logSession('success', 'logout');
  return sessionResponse('', 0);
}
