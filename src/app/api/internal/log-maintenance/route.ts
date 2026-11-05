import { matchesAdminPassword } from '@/server/admin-session';
import { getSuperAdminToken, getRuntimeValue } from '@/server/runtime';
import { getServerDb } from '@/server/db';
import { maintainLogs } from '@/services/log-maintenance';

export async function POST(request: Request) {
  const token = getRuntimeValue('CRON_SECRET') || getSuperAdminToken();
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!token || !supplied || !matchesAdminPassword(supplied, token)) return new Response(null, { status: 401 });
  try {
    await maintainLogs(getServerDb());
    return new Response(null, { status: 204 });
  } catch {
    console.error('定时日志清理失败');
    return new Response(null, { status: 500 });
  }
}

export const GET = POST;
