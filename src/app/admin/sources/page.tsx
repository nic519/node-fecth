import { requireAdminSession } from '@/server/admin-page';

import { SourcesClient } from './SourcesClient';

export default async function AdminSourcesPage() {
  await requireAdminSession('/admin/sources');
  return <SourcesClient />;
}
