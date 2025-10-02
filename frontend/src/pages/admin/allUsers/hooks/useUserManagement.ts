// 直接使用类型安全的原始函数（Hono 最佳实践）
import { adminDeleteUser, adminGetUsers, adminUserCreate } from '@/generated/api-adapters.g';
import type { UserConfig, UserSummary } from '@/types/user-config';
import { useEffect, useState } from 'react';

export interface UseUserManagementProps {
	superToken: string;
	showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export interface UseUserManagementReturn {
	users: UserSummary[];
	loading: boolean;
	error: string | null;
	fetchUsers: () => Promise<void>;
	handleUserAction: (action: string, uid: string, token?: string) => Promise<void>;
	handleAddUser: () => void;
	// Modal states
	showDeleteModal: boolean;
	showAddUserModal: boolean;
	userToDelete: string | null;
	closeDeleteModal: () => void;
	closeAddUserModal: () => void;
	confirmDeleteUser: () => Promise<void>;
	newUserUid: string;
	newUserToken: string;
	newUserSubscribe: string;
	setNewUserUid: (uid: string) => void;
	setNewUserToken: (token: string) => void;
	setNewUserSubscribe: (subscribe: string) => void;
	confirmAddUser: () => Promise<void>;
}

/**
 * 用户管理Hook - 处理用户数据的CRUD操作
 */
export const useUserManagement = ({ superToken, showToast }: UseUserManagementProps): UseUserManagementReturn => {
	const [users, setUsers] = useState<UserSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Modal states
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showAddUserModal, setShowAddUserModal] = useState(false);
	const [userToDelete, setUserToDelete] = useState<string | null>(null);
	const [newUserUid, setNewUserUid] = useState('');
	const [newUserToken, setNewUserToken] = useState('');
	const [newUserSubscribe, setNewUserSubscribe] = useState('');

	// 初始化时获取用户列表
	useEffect(() => {
		if (!superToken) {
			setError('缺少管理员令牌');
			setLoading(false);
			return;
		}
		fetchUsers();
	}, [superToken]);

	/**
	 * 获取用户列表
	 */
	const fetchUsers = async () => {
		try {
			setLoading(true);
			setError(null);

			// 调用原始 API 函数（完全类型安全）
			const response = await adminGetUsers(superToken);

			// 检查业务响应码
			if (response.code !== 0) {
				setError(response.msg || '获取用户列表失败');
				setUsers([]);
				return;
			}

			// 从响应结构中提取用户列表数据
			setUsers(response.data.users);
		} catch (err) {
			console.error('获取用户列表失败:', err);
			setError(err instanceof Error ? err.message : '加载用户数据失败');
			setUsers([]); // 确保错误时清空用户列表
		} finally {
			setLoading(false);
		}
	};

	/**
	 * 处理用户操作（查看、刷新、删除）
	 */
	const handleUserAction = async (action: string, uid: string, token?: string) => {
		switch (action) {
			case 'view':
				if (token) {
					window.open(`/config?uid=${uid}&token=${token}`, '_blank');
				}
				break;
			case 'refresh':
				// 刷新用户流量功能暂不支持
				showToast('刷新用户流量功能暂不支持，等待后端API实现', 'info');
				break;
			case 'delete':
				setUserToDelete(uid);
				setShowDeleteModal(true);
				break;
		}
	};

	// Modal control functions
	const closeDeleteModal = () => setShowDeleteModal(false);
	const closeAddUserModal = () => setShowAddUserModal(false);

	const confirmDeleteUser = async () => {
		if (!userToDelete) return;

		try {
			const response = await adminDeleteUser(superToken, { uid: userToDelete });
			if (response.code === 0) {
				showToast(`用户 ${userToDelete} 删除成功`, 'success');
				await fetchUsers(); // 重新加载用户列表
				setShowDeleteModal(false);
				setUserToDelete(null);
			} else {
				showToast('删除用户失败: ' + (response.msg || '未知错误'), 'error');
				setShowDeleteModal(false);
			}
		} catch (err) {
			console.error('删除用户失败:', err);
			showToast('删除用户失败: ' + (err instanceof Error ? err.message : '未知错误'), 'error');
			setShowDeleteModal(false);
		}
	};

	/**
	 * 添加新用户
	 */
	const handleAddUser = () => {
		setNewUserUid('');
		setNewUserToken('');
		setNewUserSubscribe('');
		setShowAddUserModal(true);
	};

	const confirmAddUser = async () => {
		if (!newUserUid.trim() || !newUserToken.trim() || !newUserSubscribe.trim()) {
			showToast('请填写完整的用户信息', 'error');
			return;
		}

		try {
			const userConfig: UserConfig = {
				subscribe: newUserSubscribe.trim(),
				accessToken: newUserToken.trim(),
			};

			const response = await adminUserCreate(superToken, { uid: newUserUid.trim(), config: userConfig });
			if (response.code === 0) {
				showToast(`用户 ${newUserUid} 创建成功`, 'success');
				await fetchUsers(); // 重新加载用户列表
				setShowAddUserModal(false);
				setNewUserUid('');
				setNewUserToken('');
				setNewUserSubscribe('');
			} else {
				showToast('创建用户失败: ' + (response.msg || '未知错误'), 'error');
			}
		} catch (error) {
			console.error('创建用户失败:', error);
			showToast('创建用户失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error');
		}
	};

	return {
		users,
		loading,
		error,
		fetchUsers,
		handleUserAction,
		handleAddUser,
		// Modal states and functions
		showDeleteModal,
		showAddUserModal,
		userToDelete,
		closeDeleteModal,
		closeAddUserModal,
		confirmDeleteUser,
		newUserUid,
		newUserToken,
		newUserSubscribe,
		setNewUserUid,
		setNewUserToken,
		setNewUserSubscribe,
		confirmAddUser,
	};
};
