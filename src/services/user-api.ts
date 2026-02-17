import { apiClient } from './api-client';
import type { ConfigResponse } from '@/types/user-config';

export const userService = {
	/**
	 * 获取用户配置
	 * GET /api/user?uid=xxx&token=xxx
	 */
	getUserConfig: (uid: string, token: string) => {
		return apiClient.get<ConfigResponse>('/user', { uid, token });
	},

	/**
	 * 更新用户配置
	 * PUT /api/user?uid=xxx&token=xxx
	 */
	updateUserConfig: (uid: string, token: string, config: any) => {
		return apiClient.put<null>('/user', { config }, { uid, token });
	},
};
