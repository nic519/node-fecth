import { AdminUsersClient } from './AdminUsersClient';
import { createServerServices } from '@/server/services';
import { getValidSuperAdminToken } from '@/server/auth';
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';

export default async function AdminUsersPage({
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

  return <AdminUsersClient superToken={superToken} initialUsers={initialUsers} />;
}
