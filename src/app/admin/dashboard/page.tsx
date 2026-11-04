import { AdminOverviewClient } from './AdminOverviewClient';
import { getValidSuperAdminToken } from '@/server/auth';
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';
import { createServerServices } from '@/server/services';

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

  const initialUsers = await createServerServices().adminService.getUserSummaryList();
  return <AdminOverviewClient superToken={superToken} initialUsers={initialUsers} />;
}
