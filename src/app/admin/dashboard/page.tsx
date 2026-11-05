import { AdminOverviewClient } from './AdminOverviewClient';
import { requireAdminSession } from '@/server/admin-page';
import { createServerServices } from '@/server/services';

export default async function AdminDashboardPage() {
  await requireAdminSession('/admin/dashboard');

  const initialUsers = await createServerServices().adminService.getUserSummaryList();
  return <AdminOverviewClient initialUsers={initialUsers} />;
}
