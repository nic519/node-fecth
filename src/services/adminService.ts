import { apiClient } from './apiClient';
import type { UserSummary } from '@/types/user-config';

export const adminService = {
	/**
	 * 获取用户列表
	 * GET /api/admin/users?superToken=xxx
	 */
	getUsers: (superToken: string) => {
		return apiClient.get<{ users: UserSummary[] }>('/admin/users', { superToken });
	},
};
