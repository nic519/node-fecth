'use client';

import type { UserAdminConfig } from '@/modules/user/admin.schema';
import { adminService } from '@/services/admin-api';
import { useCallback, useEffect, useState } from 'react';

export interface UseUserDataProps {
	initialUsers?: UserAdminConfig[];
}

export interface UseUserDataReturn {
	users: UserAdminConfig[];
	loading: boolean;
	error: string | null;
	fetchUsers: () => Promise<void>;
}

/**
 * 用户数据管理 Hook - 负责用户列表的获取和状态管理
 */
export const useUserData = ({ initialUsers = [] }: UseUserDataProps): UseUserDataReturn => {
	const [users, setUsers] = useState<UserAdminConfig[]>(initialUsers);
	const [loading, setLoading] = useState(initialUsers.length === 0);
	const [error, setError] = useState<string | null>(null);

	/**
	 * 获取用户列表
	 */
	const fetchUsers = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await adminService.getUsers();

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
	}, []);

	// 初始化时获取用户列表
	useEffect(() => {
		if (initialUsers.length > 0) {
			setLoading(false);
			return;
		}
		fetchUsers();
	}, [fetchUsers, initialUsers.length]);

	return {
		users,
		loading,
		error,
		fetchUsers,
	};
};
