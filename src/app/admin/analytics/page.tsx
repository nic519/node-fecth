import { requireAdminSession } from '@/server/admin-page';

import { SubscriptionAnalyticsClient } from './SubscriptionAnalyticsClient';

export default async function SubscriptionAnalyticsPage() {
  await requireAdminSession('/admin/analytics');
  return <SubscriptionAnalyticsClient />;
}

