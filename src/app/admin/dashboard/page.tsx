import { AdminDashboardClient } from './AdminDashboardClient';
import { getValidSuperAdminToken } from '@/server/auth';

function AdminAccessDenied() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">访问拒绝</h1>
        <p className="text-gray-600">管理员令牌无效或缺失</p>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ superToken?: string | string[] }>;
}) {
  const params = await searchParams;
  const superToken = getValidSuperAdminToken(params.superToken);

  if (!superToken) {
    return <AdminAccessDenied />;
  }

  return <AdminDashboardClient superToken={superToken} />;
}
