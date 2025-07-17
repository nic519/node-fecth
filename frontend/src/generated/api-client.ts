// ===================================================================
// 🤖 自动生成的API客户端 - 请勿手动修改
// 生成时间: 2025-07-17T16:21:03.792Z
// 基于: OpenAPI 3.1.0 规范
// ===================================================================

import ky from 'ky';
import type { components } from './api-types';
import type { 
	UserDetailResponse, 
	UsersListResponse, 
	AdminStatsResponse, 
	SuccessResponse,
	UserConfig 
} from '@/types/user-config';

// 类型别名，方便使用
export type UserSummary = components['schemas']['UserSummarySchema'];
export type AdminStats = components['schemas']['AdminStatsSchema'];
export type ConfigResponse = components['schemas']['ConfigResponseSchema'];
export type ErrorResponse = components['schemas']['ErrorResponseSchema'];

// API配置
const config = {
	apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
	isDev: import.meta.env.DEV,
};

// 创建基础API客户端
const apiClient = ky.create({
	prefixUrl: config.apiBaseUrl,
	timeout: 30000,
	retry: {
		limit: 2,
		methods: ['get'],
	},
	hooks: {
		beforeError: [
			(error) => {
				const { response } = error;
				if (response && response.body) {
					error.name = 'ApiError';
					error.message = `请求失败: ${response.status} ${response.statusText}`;
				}
				return error;
			},
		],
	},
});

// ===================================================================
// 用户配置API
// ===================================================================

export const userConfigApi = {
	/**
	 * 获取用户详情
	 */
	async getDetail(uid: string, token: string): Promise<UserDetailResponse> {
		return apiClient
			.get(`config/user/detail/${uid}`, {
				searchParams: { token },
			})
			.json<UserDetailResponse>();
	},

	/**
	 * 更新用户配置
	 */
	async update(uid: string, config: UserConfig, token: string): Promise<SuccessResponse> {
		return apiClient.post(`config/user/update/${uid}`, {
			json: { config },
			searchParams: { token },
		}).json<SuccessResponse>();
	},

	/**
	 * 删除用户配置
	 */
	async delete(uid: string, token: string): Promise<SuccessResponse> {
		return apiClient.delete(`config/user/delete/${uid}`, {
			searchParams: { token },
		}).json<SuccessResponse>();
	},
};

// ===================================================================
// 管理员API
// ===================================================================

export const adminApi = {
	/**
	 * 获取所有用户列表
	 */
	async getAllUsers(superToken: string): Promise<UsersListResponse> {
		return apiClient
			.get('config/user/all', {
				searchParams: { superToken },
			})
			.json<UsersListResponse>();
	},

	/**
	 * 创建新用户
	 */
	async createUser(uid: string, config: UserConfig, superToken: string): Promise<SuccessResponse> {
		return apiClient
			.post(`config/user/create/${uid}`, {
				json: { config },
				searchParams: { superToken },
			})
			.json<SuccessResponse>();
	},

	/**
	 * 删除用户
	 */
	async deleteUser(uid: string, superToken: string): Promise<SuccessResponse> {
		return apiClient
			.delete(`config/user/delete/${uid}`, {
				searchParams: { superToken },
			})
			.json<SuccessResponse>();
	},

	/**
	 * 获取系统统计数据
	 */
	async getStats(superToken: string): Promise<AdminStatsResponse> {
		return apiClient
			.get('admin/stats', {
				searchParams: { superToken },
			})
			.json<AdminStatsResponse>();
	},
};

// ===================================================================
// 订阅API
// ===================================================================

export const subscriptionApi = {
	/**
	 * 获取订阅配置
	 */
	async getConfig(
		uid: string, 
		token: string, 
		options?: {
			type?: 'clash' | 'v2ray' | 'ss';
			udp?: boolean;
			download?: boolean;
		}
	): Promise<string> {
		return apiClient
			.get(uid, {
				searchParams: { 
					token, 
					...options 
				},
			})
			.text();
	},
};

// ===================================================================
// 存储API
// ===================================================================

export const storageApi = {
	/**
	 * 存储操作
	 */
	async operation(action: string, key?: string, token?: string): Promise<any> {
		return apiClient
			.get('storage', {
				searchParams: { 
					action, 
					...(key && { key }), 
					...(token && { token }) 
				},
			})
			.json();
	},
};

// ===================================================================
// KV存储API
// ===================================================================

export const kvApi = {
	/**
	 * KV存储操作
	 */
	async operation(params: Record<string, string>): Promise<any> {
		return apiClient
			.get('kv', {
				searchParams: params,
			})
			.json();
	},
};

// ===================================================================
// 健康检查API
// ===================================================================

export const healthApi = {
	/**
	 * 健康检查
	 */
	async check(): Promise<{ code: number; msg: string; data: { status: string; timestamp: string } }> {
		return apiClient
			.get('health')
			.json();
	},
};

// 导出配置供其他模块使用
export { config };

// 导出类型定义
export type * from './api-types';
