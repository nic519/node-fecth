import { apiClient } from './api-client';
import type { UserAdminConfig } from '@/modules/user/admin.schema';
import type { UserConfig } from '@/types/user-config';
import type { DynamicHistoryCursor, DynamicHistoryPage } from '@/types/schema/dynamic';

export const adminService = {
	/**
	 * 获取用户列表
	 * GET /api/admin/users
	 */
	getUsers: () => {
		return apiClient.get<{ users: UserAdminConfig[] }>('/admin/users');
	},

	getSourceHistory: (url: string, cursor?: DynamicHistoryCursor) => {
		return apiClient.post<DynamicHistoryPage>('/admin/sources/history', { url, cursor });
	},

	/**
	 * 添加用户
	 * POST /api/admin/users
	 */
	addUser: (data: { uid: string; config: UserConfig }) => {
		return apiClient.post<null>('/admin/users', data);
	},

	/**
	 * 删除用户
	 * DELETE /api/admin/users/:uid
	 */
	deleteUser: (uid: string) => {
		return apiClient.delete<null>(`/admin/users/${uid}`);
	},
};
