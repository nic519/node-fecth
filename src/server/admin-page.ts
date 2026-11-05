import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminSessionCookie, isValidAdminSession } from '@/server/admin-session';

const adminPaths = ['/admin/dashboard', '/admin/analytics', '/admin/sources', '/admin/users', '/admin/templates', '/admin/logs'] as const;
type AdminPath = typeof adminPaths[number];

export function adminReturnPath(next: unknown): AdminPath {
  return adminPaths.find((path) => path === next) ?? '/admin/dashboard';
}

export async function hasAdminSession(): Promise<boolean> {
  return isValidAdminSession((await cookies()).get(adminSessionCookie)?.value);
}

export async function requireAdminSession(path: AdminPath): Promise<void> {
  if (!await hasAdminSession()) {
    redirect(`/admin/login?next=${encodeURIComponent(path)}`);
  }
}
