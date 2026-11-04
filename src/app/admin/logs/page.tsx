import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';
import { getValidSuperAdminToken } from '@/server/auth';
import { AdminDashboardClient } from '../dashboard/AdminDashboardClient';

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ superToken?: string | string[] }>;
}) {
  const params = await searchParams;
  const superToken = getValidSuperAdminToken(params.superToken);
  if (!superToken) return <AdminAccessDenied />;
  return <AdminDashboardClient superToken={superToken} />;
}
