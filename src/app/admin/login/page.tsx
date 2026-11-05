import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { adminReturnPath, hasAdminSession } from '@/server/admin-page';
import { AdminLoginForm } from './AdminLoginForm';

export const metadata: Metadata = {
  title: '后台登录 - NodeFetch',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const next = adminReturnPath((await searchParams).next);
  if (await hasAdminSession()) redirect(next);

  return <AdminLoginForm next={next} />;
}
