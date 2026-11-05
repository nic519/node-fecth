import { requireAdminSession } from '@/server/admin-page';
import { AdminDashboardClient } from '../dashboard/AdminDashboardClient';

export default async function AdminLogsPage() {
  await requireAdminSession('/admin/logs');
  return <AdminDashboardClient />;
}
