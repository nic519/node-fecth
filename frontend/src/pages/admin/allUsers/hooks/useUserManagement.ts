import { adminApi } from '@/generated/api-adapters';
import type { UserConfig, UserSummary } from '@/types/user-config';
import { useEffect, useState } from 'preact/hooks';

export interface UseUserManagementProps {
	superToken: string;
}

export interface UseUserManagementReturn {
	users: UserSummary[];
	loading: boolean;
	error: string | null;
	fetchUsers: () => Promise<void>;
	handleUserAction: (action: string, uid: string, token?: string) => Promise<void>;
	handleAddUser: () => Promise<void>;
}

/**
 * 用户管理Hook - 处理用户数据的CRUD操作
 */
export const useUserManagement = ({ superToken }: UseUserManagementProps): UseUserManagementReturn => {
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

			// 调用真实的管理员 API 获取用户列表
			const response = await adminApi.getAllUsers(superToken);
			
			// 检查响应状态
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
		try {
			switch (action) {
				case 'view':
					if (token) {
						window.open(`/config/${uid}?token=${token}`, '_blank');
					}
					break;
				case 'refresh':
					// 刷新用户流量功能暂不支持
					alert('刷新用户流量功能暂不支持，等待后端API实现');
					break;
				case 'delete':
					if (confirm(`确定要删除用户 ${uid} 吗？此操作不可撤销！`)) {
						try {
							const response = await adminApi.deleteUser(uid, superToken);
							if (response.code === 0) {
								await fetchUsers(); // 重新加载用户列表
								alert(`用户 ${uid} 删除成功`);
							} else {
								alert('删除用户失败: ' + (response.msg || '未知错误'));
							}
						} catch (err) {
							console.error('删除用户失败:', err);
							alert('删除用户失败: ' + (err instanceof Error ? err.message : '未知错误'));
						}
					}
					break;
			}
		} catch (error) {
			console.error('用户操作失败:', error);
			setError(error instanceof Error ? error.message : '操作失败');
		}
	};

	/**
	 * 添加新用户
	 */
	const handleAddUser = async () => {
		const uid = prompt('请输入新用户ID:');
		if (!uid || !uid.trim()) {
			return;
		}

		const accessToken = prompt('请输入用户访问令牌:');
		if (!accessToken || !accessToken.trim()) {
			return;
		}

		const subscribe = prompt('请输入订阅链接:');
		if (!subscribe || !subscribe.trim()) {
			return;
		}

		try {
			const userConfig: UserConfig = {
				subscribe: subscribe.trim(),
				accessToken: accessToken.trim(),
			};

			const response = await adminApi.createUser(uid.trim(), userConfig, superToken);
			if (response.code === 0) {
				await fetchUsers(); // 重新加载用户列表
				alert(`用户 ${uid} 创建成功`);
			} else {
				alert('创建用户失败: ' + (response.msg || '未知错误'));
			}
		} catch (error) {
			console.error('创建用户失败:', error);
			alert('创建用户失败: ' + (error instanceof Error ? error.message : '未知错误'));
		}
	};

	return {
		users,
		loading,
		error,
		fetchUsers,
		handleUserAction,
		handleAddUser,
	};
}; 