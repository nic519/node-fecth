'use client';

// 导入自定义hooks
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToastContext } from '@/providers/toast-provider';
import { useUserFilters } from './hooks/useUserFilters';
import { useUserManagement } from './hooks/useUserManagement';

// 导入组件
import { NavigationBar } from '@/components/NavigationBar';
import { UserFilters } from './components/UserFilters';
import { UserMasonry } from './components/UserMasonry';

// 导入UI组件
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from 'lucide-react';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AdminUsersContent() {
	// 设置页面标题
	usePageTitle('用户管理');

	// 获取超级管理员令牌
	const searchParams = useSearchParams();
	const superToken = searchParams.get('superToken') || '';

	// 获取 Toast 上下文
	const { showToast } = useToastContext();

	// 使用用户管理Hook
	const { users, loading, error, fetchUsers, handleUserAction, deleteModal, addUserModal } = useUserManagement({
		superToken,
		showToast,
	});

	// 使用用户过滤Hook
	const { filteredUsers, searchTerm, setSearchTerm } = useUserFilters({
		users,
	});

	return (
		<div className="min-h-screen">
			{/* 导航栏 */}
			<NavigationBar superToken={superToken} currentPage="users" />

			<main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
					{/* 左侧：筛选和操作 */}
					<div className="lg:col-span-1 sticky top-24 z-10">
						<UserFilters
							searchTerm={searchTerm}
							loading={loading}
							onSearchTermChange={setSearchTerm}
							onRefresh={fetchUsers}
							onAddUser={addUserModal.open}
						/>
					</div>

					{/* 右侧：列表和数据 */}
					<div className="lg:col-span-3 space-y-6">
						{/* 错误信息 */}
						{error && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-4">
								<div className="text-red-800">{error}</div>
							</div>
						)}

						{/* 用户列表 - 瀑布流展示 */}
						<UserMasonry users={filteredUsers} loading={loading} error={error} onUserAction={handleUserAction} />

						{/* 分页信息 */}
						<div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-xl shadow-sm">
							<div className="flex items-center text-xs text-gray-600">
								<span>共 {filteredUsers.length} 条记录</span>
							</div>
							<div className="flex gap-1">
								<Button size="sm" variant="outline" className="bg-gray-100 text-gray-400 border-transparent" disabled>
									上一页
								</Button>
								<Button size="sm" variant="default" className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
									1
								</Button>
								<Button size="sm" variant="outline" className="bg-gray-100 text-gray-400 border-transparent" disabled>
									下一页
								</Button>
							</div>
						</div>
					</div>
				</div>
			</main>

			{/* 删除用户确认模态框 */}
			<Dialog open={deleteModal.isOpen} onOpenChange={(open) => !open && deleteModal.close()}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>确认删除用户</DialogTitle>
						<DialogDescription>
							确定要删除用户 {deleteModal.userToDelete} 吗？此操作不可撤销！
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="secondary" onClick={deleteModal.close}>
							取消
						</Button>
						<Button variant="destructive" onClick={deleteModal.confirm} disabled={loading}>
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							删除
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 添加用户模态框 */}
			<Dialog open={addUserModal.isOpen} onOpenChange={(open) => !open && addUserModal.close()}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>添加新用户</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label className="text-right">用户ID</Label>
							<Input
								className="col-span-3"
								placeholder="请输入用户ID"
								value={addUserModal.form.uid}
								onChange={(e) => addUserModal.setUid(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>访问令牌</Label>
							<Input
								placeholder="请输入用户访问令牌"
								value={addUserModal.form.token}
								onChange={(e) => addUserModal.setToken(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>订阅链接</Label>
							<Input
								placeholder="请输入订阅链接"
								value={addUserModal.form.subscribe}
								onChange={(e) => addUserModal.setSubscribe(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="secondary" onClick={addUserModal.close}>
							取消
						</Button>
						<Button
							onClick={addUserModal.confirm}
							disabled={loading}
							className="bg-blue-600 hover:bg-blue-700 text-white"
						>
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							添加
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default function AdminUsers() {
	return (
		<Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
			<AdminUsersContent />
		</Suspense>
	);
}
