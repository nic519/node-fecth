import { AdminUsersClient } from './AdminUsersClient';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ superToken?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawSuperToken = params.superToken;
  const superToken = Array.isArray(rawSuperToken) ? rawSuperToken[0] : rawSuperToken;

  return <AdminUsersClient superToken={superToken ?? ''} />;
}
