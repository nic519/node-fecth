'use client';

import type { UserConfig } from '@/types/user-config';
import { adminService } from '@/services/admin-api';
import { DEFAULT_SUB_FLAG } from '@/config/constants';

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
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#';
		const randomValues = new Uint32Array(length);
		crypto.getRandomValues(randomValues);
		return [...randomValues].map((value) => chars.charAt(value % chars.length)).join('');
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
		const uid = newUserUid.trim();
		const token = newUserToken.trim();
		const subscribe = newUserSubscribe.trim();

		if (!uid || !token || !subscribe) {
			showToast('请填写完整的用户信息', 'error');
			return;
		}
		if (!/^[A-Za-z0-9_-]{4,}$/.test(uid)) {
			showToast('用户 ID 至少 4 位，只能包含字母、数字、下划线和短横线', 'error');
			return;
		}
		if (token.length < 8) {
			showToast('访问令牌至少 8 位', 'error');
			return;
		}
		try {
			const parsed = new URL(subscribe);
			if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
		} catch {
			showToast('订阅链接必须是有效的 HTTP / HTTPS URL', 'error');
			return;
		}

		try {
			const userConfig: UserConfig = {
				accessToken: token,
				appendSubList: [{
					subscribe,
					flag: DEFAULT_SUB_FLAG,
				}],
			};

			const response = await adminService.addUser(superToken, { uid, config: userConfig });

			if (response.code === 0) {
				showToast(`用户 ${uid} 创建成功`, 'success');
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
