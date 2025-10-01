// 导入自定义hooks
import { usePageTitle } from '@/hooks/usePageTitle';
import { useUserFilters } from './hooks/useUserFilters';
import { useUserManagement } from './hooks/useUserManagement';

// 导入组件
import { NavigationBar } from '@/components/NavigationBar';
import { UserFilters } from './components/UserFilters';
import { UserTable } from './components/UserTable';

// 导入HeroUI组件
import { Button, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';

export function AdminUsers() {
	// 设置页面标题
	usePageTitle('用户管理');

	// 获取超级管理员令牌
	const superToken = new URLSearchParams(window.location.search).get('superToken') || '';

	// 使用用户管理Hook
	const {
		users,
		loading,
		error,
		fetchUsers,
		handleUserAction,
		handleAddUser,
		// Modal states
		showDeleteModal,
		showAddUserModal,
		showMessageModal,
		modalMessage,
		userToDelete,
		closeDeleteModal,
		closeAddUserModal,
		closeMessageModal,
		confirmDeleteUser,
		newUserUid,
		newUserToken,
		newUserSubscribe,
		setNewUserUid,
		setNewUserToken,
		setNewUserSubscribe,
		confirmAddUser,
	} = useUserManagement({
		superToken,
	});

	// 判断消息类型
	const getMessageType = (message: string) => {
		if (message.includes('成功') || message.includes('创建成功') || message.includes('删除成功')) {
			return { color: 'success', icon: '✓' };
		} else if (message.includes('失败') || message.includes('错误')) {
			return { color: 'danger', icon: '✕' };
		} else if (message.includes('不支持') || message.includes('请填写')) {
			return { color: 'warning', icon: '⚠' };
		}
		return { color: 'primary', icon: 'ℹ' };
	};

	// 使用用户过滤Hook
	const { filteredUsers, searchTerm, statusFilter, sourceFilter, setSearchTerm, setStatusFilter, setSourceFilter } = useUserFilters({
		users,
	});

	return (
		<div className="min-h-screen bg-gray-100">
			{/* 导航栏 */}
			<NavigationBar superToken={superToken} currentPage="users" />

			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-4 sm:px-0 space-y-4">
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
						onAddUser={handleAddUser}
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
					<div className="flex items-center justify-between bg-white px-4 py-2 border rounded-lg">
						<div className="flex items-center text-xs text-gray-600">
							<span>共 {filteredUsers.length} 条记录</span>
						</div>
						<div className="flex gap-1">
							<Button size="sm" variant="solid" color="default" disabled>
								上一页
							</Button>
							<Button size="sm" variant="solid" className="bg-blue-600 text-white hover:bg-blue-700">
								1
							</Button>
							<Button size="sm" variant="solid" color="default" disabled>
								下一页
							</Button>
						</div>
					</div>
				</div>
			</main>

			{/* 删除用户确认模态框 */}
			<Modal isOpen={showDeleteModal} onOpenChange={closeDeleteModal}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">确认删除用户</ModalHeader>
							<ModalBody>
								<p>确定要删除用户 {userToDelete} 吗？此操作不可撤销！</p>
							</ModalBody>
							<ModalFooter>
								<Button color="default" variant="solid" onPress={onClose}>
									取消
								</Button>
								<Button color="danger" onPress={confirmDeleteUser} isLoading={loading}>
									删除
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* 添加用户模态框 */}
			<Modal isOpen={showAddUserModal} onOpenChange={closeAddUserModal}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">添加新用户</ModalHeader>
							<ModalBody>
								<div className="space-y-4">
									<Input
										label="用户ID"
										placeholder="请输入用户ID"
										value={newUserUid}
										onChange={(e) => setNewUserUid(e.target.value)}
										variant="bordered"
									/>
									<Input
										label="访问令牌"
										placeholder="请输入用户访问令牌"
										value={newUserToken}
										onChange={(e) => setNewUserToken(e.target.value)}
										variant="bordered"
									/>
									<Input
										label="订阅链接"
										placeholder="请输入订阅链接"
										value={newUserSubscribe}
										onChange={(e) => setNewUserSubscribe(e.target.value)}
										variant="bordered"
									/>
								</div>
							</ModalBody>
							<ModalFooter>
								<Button color="default" variant="solid" onPress={onClose}>
									取消
								</Button>
								<Button
									onPress={confirmAddUser}
									isLoading={loading}
									className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
								>
									添加
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* 消息提示模态框 */}
			<Modal isOpen={showMessageModal} onOpenChange={closeMessageModal} size="sm">
				<ModalContent>
					{(onClose) => {
						const messageType = getMessageType(modalMessage);
						return (
							<>
								<ModalHeader className="flex flex-col gap-1 items-center">
									<Chip color={messageType.color as any} variant="solid" size="lg" className="mb-2">
										<span className="text-lg mr-2">{messageType.icon}</span>
										{messageType.color === 'success'
											? '成功'
											: messageType.color === 'danger'
												? '错误'
												: messageType.color === 'warning'
													? '警告'
													: '提示'}
									</Chip>
								</ModalHeader>
								<ModalBody className="text-center">
									<p className="text-gray-700">{modalMessage}</p>
								</ModalBody>
								<ModalFooter className="justify-center">
									<Button color={messageType.color as any} variant="solid" onPress={onClose} autoFocus>
										确定
									</Button>
								</ModalFooter>
							</>
						);
					}}
				</ModalContent>
			</Modal>
		</div>
	);
}
