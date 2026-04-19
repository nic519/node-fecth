import { AdminDashboardClient } from './AdminDashboardClient';
import { getValidSuperAdminToken } from '@/server/auth';
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ superToken?: string | string[] }>;
}) {
  const params = await searchParams;
  const superToken = getValidSuperAdminToken(params.superToken);

  if (!superToken) {
    return <AdminAccessDenied />;
  }

  return <AdminDashboardClient superToken={superToken} />;
}
