'use client';

import type { UserAdminConfig } from '@/modules/user/admin.schema';
import { useAddUserModal } from './useAddUserModal';
import { useDeleteUserModal } from './useDeleteUserModal';
import { useImportUserModal } from './useImportUserModal';
import { useUserData } from './useUserData';

export interface UseUserManagementProps {
	superToken: string;
	showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export interface UseUserManagementReturn {
	// 用户数据
	users: UserAdminConfig[];
	loading: boolean;
	error: string | null;
	fetchUsers: () => Promise<void>;
	// 用户操作
	handleUserAction: (action: string, uid: string, token?: string) => Promise<void>;
	// 导出用户
	handleExport: () => void;
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
	// 导入用户模态框（封装）
	importModal: {
		isOpen: boolean;
		jsonContent: string;
		setJsonContent: (content: string) => void;
		isImporting: boolean;
		importProgress: { current: number; total: number };
		importErrors: string[];
		open: () => void;
		close: () => void;
		handleImport: () => Promise<void>;
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

	// 导入用户模态框管理
	const importModal = useImportUserModal({
		superToken,
		existingUsers: userData.users,
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

	/**
	 * 导出用户配置
	 */
	const handleExport = () => {
		try {
			// 创建一个纯净的用户配置数组，去掉不必要的字段（可选，这里直接导出完整数据以便迁移）
			const dataToExport = userData.users.map(user => ({
				uid: user.uid,
				config: {  
					...user
				}
			})).map(item => {
				// 清理一下结构，使其符合导入格式 { uid: string, config: UserConfig }
				const { uid, updatedAt, subscriptionStats, ...config } = item.config;
				return {
					uid: item.uid,
					config: config
				};
			});

			const dataStr = JSON.stringify(dataToExport, null, 2);
			const blob = new Blob([dataStr], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			showToast('导出成功', 'success');
		} catch (error) {
			console.error('导出失败:', error);
			showToast('导出失败', 'error');
		}
	};

	return {
		...userData,
		handleUserAction,
		handleExport,
		deleteModal,
		addUserModal,
		importModal,
	};
};
