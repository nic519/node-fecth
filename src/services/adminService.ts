import { apiClient } from './apiClient';
import type { UserAdminConfig } from '@/module/userManager/types/supper-admin.types';

export const adminService = {
	/**
	 * 获取用户列表
	 * GET /api/admin/users?superToken=xxx
	 */
	getUsers: (superToken: string) => {
		return apiClient.get<{ users: UserAdminConfig[] }>('/admin/users', { superToken });
	},
};
