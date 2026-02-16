'use client';

import type { UserSummary } from '@/types/user-config';
import { useCallback, useEffect, useState } from 'react';

interface ApiResponse<T> {
	code: number;
	msg: string;
	data: T;
}

export interface UseUserDataProps {
	superToken: string;
}

export interface UseUserDataReturn {
	users: UserSummary[];
	loading: boolean;
	error: string | null;
	fetchUsers: () => Promise<void>;
}

/**
 * 用户数据管理 Hook - 负责用户列表的获取和状态管理
 */
export const useUserData = ({ superToken }: UseUserDataProps): UseUserDataReturn => {
	const [users, setUsers] = useState<UserSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/**
	 * 获取用户列表
	 */
	const fetchUsers = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const res = await fetch(`/api/admin/users?superToken=${superToken}`);
			const response = await res.json() as ApiResponse<{ users: UserSummary[] }>;

			// 检查业务响应码
			if (response.code !== 0) {
				setError(response.msg || '获取用户列表失败');
				setUsers([]);
				return;
			}

			// 从响应结构中提取用户列表数据
			setUsers(
				response.data.users.map((user: UserSummary) => ({
					uid: user.uid,
					token: user.token,
					status: user.status,
					hasConfig: user.hasConfig,
					lastModified: user.lastModified,
					isActive: user.isActive,
					trafficInfo: user.trafficInfo,
					subscribeUrl: user.subscribeUrl,
				})),
			);
		} catch (err) {
			console.error('获取用户列表失败:', err);
			setError(err instanceof Error ? err.message : '加载用户数据失败');
			setUsers([]); // 确保错误时清空用户列表
		} finally {
			setLoading(false);
		}
	}, [superToken]);

	// 初始化时获取用户列表
	useEffect(() => {
		if (!superToken) {
			setError('缺少管理员令牌');
			setLoading(false);
			return;
		}
		fetchUsers();
	}, [superToken, fetchUsers]);

	return {
		users,
		loading,
		error,
		fetchUsers,
	};
};
