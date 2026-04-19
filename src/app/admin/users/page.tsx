import { AdminUsersClient } from './AdminUsersClient';
import { createServerServices } from '@/server/services';
import { getValidSuperAdminToken } from '@/server/auth';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ superToken?: string | string[] }>;
}) {
  const params = await searchParams;
  const superToken = getValidSuperAdminToken(params.superToken);
  const initialUsers = superToken
    ? await createServerServices().adminService.getUserSummaryList()
    : [];

  return <AdminUsersClient superToken={superToken ?? ''} initialUsers={initialUsers} />;
}
