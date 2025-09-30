// 导入自定义hooks
import { useUserManagement } from './hooks/useUserManagement';
import { useUserFilters } from './hooks/useUserFilters';
import { usePageTitle } from '@/hooks/usePageTitle';

// 导入组件
import { NavigationBar } from '@/components/NavigationBar';
import { UserFilters } from './components/UserFilters';
import { UserTable } from './components/UserTable';

export function AdminUsers() {
	// 设置页面标题
	usePageTitle('用户管理');

	// 获取超级管理员令牌
	const superToken = new URLSearchParams(window.location.search).get('superToken') || '';

	// 使用用户管理Hook
	const { users, loading, error, fetchUsers, handleUserAction, handleAddUser } = useUserManagement({
		superToken,
	});

	// 使用用户过滤Hook
	const {
		filteredUsers,
		searchTerm,
		statusFilter,
		sourceFilter,
		setSearchTerm,
		setStatusFilter,
		setSourceFilter,
	} = useUserFilters({ users });

	return (
		<div className="min-h-screen bg-gray-100">
			{/* 导航栏 */}
			<NavigationBar superToken={superToken} currentPage="users" />

			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0 space-y-6">
					{/* 页面标题和操作按钮 */}
					<div className="flex justify-between items-center">
						<div>
							<h2 className="text-2xl font-bold text-gray-900">用户管理</h2>
							<p className="text-gray-600 mt-1">管理系统中的所有用户账户，支持实时查看、创建、删除和流量管理</p>
						</div>
						<button 
							onClick={handleAddUser} 
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							+ 添加用户
						</button>
					</div>

					{/* 搜索和筛选 */}
					<UserFilters
						searchTerm={searchTerm}
						statusFilter={statusFilter}
						sourceFilter={sourceFilter}
						loading={loading}
						onSearchTermChange={setSearchTerm}
						onStatusFilterChange={setStatusFilter}
						onSourceFilterChange={setSourceFilter}
						onRefresh={fetchUsers}
					/>

					{/* 错误信息 */}
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4">
							<div className="text-red-800">{error}</div>
						</div>
					)}

					{/* 用户列表 */}
					<UserTable
						users={filteredUsers}
						loading={loading}
						error={error}
						onUserAction={handleUserAction}
					/>

					{/* 分页信息 */}
					<div className="flex items-center justify-between bg-white px-4 py-3 border rounded-lg">
						<div className="flex items-center text-sm text-gray-700">
							<span>
								显示 1-{filteredUsers.length} 条，共 {filteredUsers.length} 条记录
							</span>
						</div>
						<div className="flex space-x-2">
							<button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50" disabled>
								上一页
							</button>
							<button className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</button>
							<button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50" disabled>
								下一页
							</button>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
