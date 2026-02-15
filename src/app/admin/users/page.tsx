'use client';

// 导入自定义hooks
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToastContext } from '@/providers/toast-provider';
import { useUserFilters } from './hooks/useUserFilters';
import { useUserManagement } from './hooks/useUserManagement';

// 导入组件
import { NavigationBar } from '@/components/NavigationBar';
import { UserFilters } from './components/UserFilters';
import { UserTable } from './components/UserTable';

// 导入HeroUI组件
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';

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
	const { filteredUsers, searchTerm, statusFilter, setSearchTerm, setStatusFilter } = useUserFilters({
		users,
	});

	return (
		<div className="min-h-screen">
			{/* 导航栏 */}
			<NavigationBar superToken={superToken} currentPage="users" />

			<main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="space-y-6">
					{/* 搜索和筛选 */}
					<UserFilters
						searchTerm={searchTerm}
						statusFilter={statusFilter}
						loading={loading}
						onSearchTermChange={setSearchTerm}
						onStatusFilterChange={setStatusFilter}
						onRefresh={fetchUsers}
						onAddUser={addUserModal.open}
					/>

					{/* 错误信息 */}
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4">
							<div className="text-red-800">{error}</div>
						</div>
					)}

					{/* 用户列表 */}
					<UserTable users={filteredUsers} loading={loading} error={error} onUserAction={handleUserAction} />

					{/* 分页信息 */}
					<div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-xl shadow-sm">
						<div className="flex items-center text-xs text-gray-600">
							<span>共 {filteredUsers.length} 条记录</span>
						</div>
						<div className="flex gap-1">
							<Button size="sm" variant="flat" radius="lg" className="bg-gray-100 text-gray-400 rounded-lg" disabled>
								上一页
							</Button>
							<Button size="sm" variant="solid" radius="lg" className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm">
								1
							</Button>
							<Button size="sm" variant="flat" radius="lg" className="bg-gray-100 text-gray-400 rounded-lg" disabled>
								下一页
							</Button>
						</div>
					</div>
				</div>
			</main>

			{/* 删除用户确认模态框 */}
			<Modal isOpen={deleteModal.isOpen} onOpenChange={deleteModal.close}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">确认删除用户</ModalHeader>
							<ModalBody>
								<p>确定要删除用户 {deleteModal.userToDelete} 吗？此操作不可撤销！</p>
							</ModalBody>
							<ModalFooter>
								<Button color="default" variant="flat" radius="lg" className="bg-gray-100 text-gray-700 rounded-lg" onPress={onClose}>
									取消
								</Button>
								<Button color="danger" radius="lg" className="rounded-lg" onPress={deleteModal.confirm} isLoading={loading}>
									删除
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* 添加用户模态框 */}
			<Modal isOpen={addUserModal.isOpen} onOpenChange={addUserModal.close}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">添加新用户</ModalHeader>
							<ModalBody>
								<div className="space-y-4">
									<Input
										label="用户ID"
										placeholder="请输入用户ID"
										value={addUserModal.form.uid}
										onChange={(e) => addUserModal.setUid(e.target.value)}
										variant="bordered"
									/>
									<Input
										label="访问令牌"
										placeholder="请输入用户访问令牌"
										value={addUserModal.form.token}
										onChange={(e) => addUserModal.setToken(e.target.value)}
										variant="bordered"
									/>
									<Input
										label="订阅链接"
										placeholder="请输入订阅链接"
										value={addUserModal.form.subscribe}
										onChange={(e) => addUserModal.setSubscribe(e.target.value)}
										variant="bordered"
									/>
								</div>
							</ModalBody>
							<ModalFooter>
								<Button color="default" variant="flat" radius="lg" className="bg-gray-100 text-gray-700 rounded-lg" onPress={onClose}>
									取消
								</Button>
								<Button
									onPress={addUserModal.confirm}
									isLoading={loading}
									radius="lg"
									className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 rounded-lg"
								>
									添加
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
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
