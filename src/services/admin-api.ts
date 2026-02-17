import { apiClient } from './api-client';
import type { UserAdminConfig } from '@/modules/user/admin.schema';
import type { UserConfig } from '@/types/user-config';

export const adminService = {
	/**
	 * 获取用户列表
	 * GET /api/admin/users?superToken=xxx
	 */
	getUsers: (superToken: string) => {
		return apiClient.get<{ users: UserAdminConfig[] }>('/admin/users', { superToken });
	},

	/**
	 * 添加用户
	 * POST /api/admin/users?superToken=xxx
	 */
	addUser: (superToken: string, data: { uid: string; config: UserConfig }) => {
		return apiClient.post<null>('/admin/users', data, { superToken });
	},

	/**
	 * 删除用户
	 * DELETE /api/admin/users/:uid?superToken=xxx
	 */
	deleteUser: (superToken: string, uid: string) => {
		return apiClient.delete<null>(`/admin/users/${uid}`, { superToken });
	},
};
