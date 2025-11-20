import { adminGetUsers } from '@/generated/api-adapters.g';
import type { UserSummary } from '@/types/user-config';
import { useEffect, useState } from 'react';

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

	return {
		users,
		loading,
		error,
		fetchUsers,
	};
};



