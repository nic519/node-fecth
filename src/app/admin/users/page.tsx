import { AdminUsersClient } from './AdminUsersClient';
import { createServerServices } from '@/server/services';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ superToken?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawSuperToken = params.superToken;
  const superToken = Array.isArray(rawSuperToken) ? rawSuperToken[0] : rawSuperToken;
  const initialUsers = superToken
    ? await createServerServices().adminService.getUserSummaryList()
    : [];

  return <AdminUsersClient superToken={superToken ?? ''} initialUsers={initialUsers} />;
}
