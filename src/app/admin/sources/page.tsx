import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';
import { getValidSuperAdminToken } from '@/server/auth';

import { SourcesClient } from './SourcesClient';

export default async function AdminSourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ superToken?: string | string[] }>;
}) {
  const params = await searchParams;
  const superToken = getValidSuperAdminToken(params.superToken);

  if (!superToken) return <AdminAccessDenied />;
  return <SourcesClient superToken={superToken} />;
}
