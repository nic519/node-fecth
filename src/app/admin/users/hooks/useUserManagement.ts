'use client';

import type { UserSummary } from '@/types/user-config';
import { useAddUserModal } from './useAddUserModal';
import { useDeleteUserModal } from './useDeleteUserModal';
import { useUserData } from './useUserData';

export interface UseUserManagementProps {
	superToken: string;
	showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export interface UseUserManagementReturn {
	// 用户数据
	users: UserSummary[];
	loading: boolean;
	error: string | null;
	fetchUsers: () => Promise<void>;
	// 用户操作
	handleUserAction: (action: string, uid: string, token?: string) => Promise<void>;
	// 删除用户模态框（封装）
	deleteModal: {
		isOpen: boolean;
		userToDelete: string | null;
		close: () => void;
		confirm: () => Promise<void>;
	};
	// 添加用户模态框（封装）
	addUserModal: {
		isOpen: boolean;
		form: {
			uid: string;
			token: string;
			subscribe: string;
		};
		setUid: (uid: string) => void;
		setToken: (token: string) => void;
		setSubscribe: (subscribe: string) => void;
		open: () => void;
		close: () => void;
		confirm: () => Promise<void>;
	};
}

/**
 * 用户管理主 Hook - 协调各个子 Hook，提供统一的接口
 */
export const useUserManagement = ({ superToken, showToast }: UseUserManagementProps): UseUserManagementReturn => {
	// 用户数据管理
	const userData = useUserData({ superToken });

	// 删除用户模态框管理
	const { deleteModal } = useDeleteUserModal({
		superToken,
		showToast,
		onSuccess: userData.fetchUsers,
	});

	// 添加用户模态框管理
	const { addUserModal } = useAddUserModal({
		superToken,
		showToast,
		onSuccess: userData.fetchUsers,
	});

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
				deleteModal.open(uid);
				break;
		}
	};

	return {
		...userData,
		handleUserAction,
		deleteModal,
		addUserModal,
	};
};
