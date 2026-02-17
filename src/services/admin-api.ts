import { apiClient } from './api-client';
import type { UserAdminConfig } from '@/modules/user/admin.schema';

export const adminService = {
	/**
	 * 获取用户列表
	 * GET /api/admin/users?superToken=xxx
	 */
	getUsers: (superToken: string) => {
		return apiClient.get<{ users: UserAdminConfig[] }>('/admin/users', { superToken });
	},
};
