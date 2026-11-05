import { AdminUsersClient } from './AdminUsersClient';
import { createServerServices } from '@/server/services';
import { requireAdminSession } from '@/server/admin-page';

export default async function AdminUsersPage() {
  await requireAdminSession('/admin/users');

  const initialUsers = await createServerServices().adminService.getUserSummaryList();

  return <AdminUsersClient initialUsers={initialUsers} />;
}
