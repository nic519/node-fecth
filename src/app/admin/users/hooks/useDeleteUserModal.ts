'use client';

import { useState } from 'react';

export interface UseDeleteUserModalProps {
	superToken: string;
	showToast: (message: string, type: 'success' | 'error' | 'info') => void;
	onSuccess?: () => void;
}

export interface DeleteModalState {
	isOpen: boolean;
	userToDelete: string | null;
	open: (uid: string) => void;
	close: () => void;
	confirm: () => Promise<void>;
}

export interface UseDeleteUserModalReturn {
	deleteModal: DeleteModalState;
}

/**
 * 删除用户模态框管理 Hook
 */
export const useDeleteUserModal = ({ superToken, showToast, onSuccess }: UseDeleteUserModalProps): UseDeleteUserModalReturn => {
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [userToDelete, setUserToDelete] = useState<string | null>(null);

	const openDeleteModal = (uid: string) => {
		setUserToDelete(uid);
		setShowDeleteModal(true);
	};

	const closeDeleteModal = () => {
		setShowDeleteModal(false);
		setUserToDelete(null);
	};

	const confirmDeleteUser = async () => {
		if (!userToDelete) return;

		try {
			const res = await fetch(`/api/admin/users/${userToDelete}?superToken=${superToken}`, {
				method: 'DELETE',
			});
			const response = await res.json() as any;

			if (response.code === 0) {
				showToast(`用户 ${userToDelete} 删除成功`, 'success');
				closeDeleteModal();
				onSuccess?.(); // 删除成功后重新加载用户列表
			} else {
				showToast('删除用户失败: ' + (response.msg || '未知错误'), 'error');
				closeDeleteModal();
			}
		} catch (err) {
			console.error('删除用户失败:', err);
			showToast('删除用户失败: ' + (err instanceof Error ? err.message : '未知错误'), 'error');
			closeDeleteModal();
		}
	};

	return {
		deleteModal: {
			isOpen: showDeleteModal,
			userToDelete,
			open: openDeleteModal,
			close: closeDeleteModal,
			confirm: confirmDeleteUser,
		},
	};
};
