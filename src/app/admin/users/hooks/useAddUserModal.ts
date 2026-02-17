'use client';

import type { UserConfig } from '@/types/user-config';
import { adminService } from '@/services/admin-api';

import { useState } from 'react';

export interface UseAddUserModalProps {
	superToken: string;
	showToast: (message: string, type: 'success' | 'error' | 'info') => void;
	onSuccess?: () => void;
}

export interface AddUserModalState {
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
}

export interface UseAddUserModalReturn {
	addUserModal: AddUserModalState;
}

/**
 * 添加用户模态框管理 Hook
 */
export const useAddUserModal = ({ superToken, showToast, onSuccess }: UseAddUserModalProps): UseAddUserModalReturn => {
	const [showAddUserModal, setShowAddUserModal] = useState(false);
	const [newUserUid, setNewUserUid] = useState('');
	const [newUserToken, setNewUserToken] = useState('');
	const [newUserSubscribe, setNewUserSubscribe] = useState('');

	const generateRandomToken = (length: number = 16) => {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	};

	const openAddUserModal = () => {
		setNewUserUid('');
		setNewUserToken(generateRandomToken());
		setNewUserSubscribe('');
		setShowAddUserModal(true);
	};

	const closeAddUserModal = () => {
		setShowAddUserModal(false);
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

			const response = await adminService.addUser(superToken, { uid: newUserUid.trim(), config: userConfig });

			if (response.code === 0) {
				showToast(`用户 ${newUserUid} 创建成功`, 'success');
				setShowAddUserModal(false);
				setNewUserUid('');
				setNewUserToken('');
				setNewUserSubscribe('');
				onSuccess?.(); // 创建成功后重新加载用户列表
			} else {
				showToast('创建用户失败: ' + (response.msg || '未知错误'), 'error');
			}
		} catch (error) {
			console.error('创建用户失败:', error);
			showToast('创建用户失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error');
		}
	};

	return {
		addUserModal: {
			isOpen: showAddUserModal,
			form: {
				uid: newUserUid,
				token: newUserToken,
				subscribe: newUserSubscribe,
			},
			setUid: setNewUserUid,
			setToken: setNewUserToken,
			setSubscribe: setNewUserSubscribe,
			open: openAddUserModal,
			close: closeAddUserModal,
			confirm: confirmAddUser,
		},
	};
};
