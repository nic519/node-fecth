import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';
import { getValidSuperAdminToken } from '@/server/auth';

import { SubscriptionAnalyticsClient } from './SubscriptionAnalyticsClient';

export default async function SubscriptionAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ superToken?: string | string[] }>;
}) {
  const params = await searchParams;
  const superToken = getValidSuperAdminToken(params.superToken);

  if (!superToken) return <AdminAccessDenied />;
  return <SubscriptionAnalyticsClient superToken={superToken} />;
}

