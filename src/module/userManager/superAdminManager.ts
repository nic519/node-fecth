import { AdminOperation, ConfigTemplate, SuperAdminStats } from '@/module/userManager/types/supper-admin.types';
import { UserConfig, UserSummary } from '@/types/openapi-schemas';
import { ProxyFetch } from '@/utils/request/proxy-fetch';
import { UserManager } from './userManager';

export class SuperAdminManager {
	private env: Env;
	private userManager: UserManager;

	constructor(env: Env) {
		this.env = env;
		this.userManager = new UserManager(env);
	}

	/**
	 * 验证超级管理员权限
	 */
	async validateSuperAdmin(token: string): Promise<boolean> {
		const superAdminToken = this.env.SUPER_ADMIN_TOKEN;
		console.log('superAdminToken', superAdminToken, token);
		if (!superAdminToken) {
			console.warn('SUPER_ADMIN_TOKEN 未配置');
			return false;
		}
		return token === superAdminToken;
	}

	/**
	 * 获取系统统计数据
	 */
	async getSystemStats(): Promise<SuperAdminStats> {
		try {
			const userList = await this.userManager.getAllUsers();
			const today = new Date().toISOString().split('T')[0];

			let kvConfigUsers = 0;
			let envConfigUsers = 0;
			let activeUsers = 0;
			let todayNewUsers = 0;

			// 分析每个用户的配置状态
			for (const uid of userList) {
				const configResponse = await this.userManager.getUserConfig(uid);
				if (configResponse) {
					if (configResponse.meta.source === 'kv') {
						kvConfigUsers++;
					} else {
						envConfigUsers++;
					}

					// 检查是否为今日新增用户
					if (configResponse.meta.lastModified?.startsWith(today)) {
						todayNewUsers++;
					}

					// 检查用户活跃度（有配置且订阅地址有效）
					if (configResponse.config.subscribe && configResponse.config.accessToken) {
						activeUsers++;
					}
				}
			}

			const configCompleteRate = userList.length > 0 ? ((kvConfigUsers + envConfigUsers) / userList.length) * 100 : 0;

			return {
				totalUsers: userList.length,
				activeUsers,
				kvConfigUsers,
				envConfigUsers,
				configCompleteRate: Math.round(configCompleteRate * 100) / 100,
				todayNewUsers,
			};
		} catch (error) {
			console.error('获取系统统计失败:', error);
			throw error;
		}
	}

	/**
	 * 获取用户摘要列表
	 */
	async getUserSummaryList(): Promise<UserSummary[]> {
		try {
			const userList = await this.userManager.getAllUsers();
			const summaries: UserSummary[] = [];

			for (const uid of userList) {
				const configResponse = await this.userManager.getUserConfig(uid);
				const subscribeUrl = configResponse?.config.subscribe;

				// 获取流量信息（仅当有订阅地址时）
				let trafficInfo: UserSummary['trafficInfo'] = undefined;
				if (subscribeUrl) {
					try {
						trafficInfo = await this.getUserTrafficInfo(subscribeUrl);
					} catch (error) {
						console.warn(`获取用户 ${uid} 流量信息失败:`, error);
					}
				}

				const summary: UserSummary = {
					uid: uid,
					token: configResponse?.config.accessToken || '',
					hasConfig: !!configResponse,
					source: configResponse?.meta.source || 'none',
					lastModified: configResponse?.meta.lastModified || null,
					isActive: !!(configResponse?.config.subscribe && configResponse?.config.accessToken),
					subscribeUrl,
					status: configResponse ? 'active' : 'inactive',
					trafficInfo,
				};
				summaries.push(summary);
			}

			// 按最后修改时间排序
			summaries.sort((a, b) => {
				if (!a.lastModified && !b.lastModified) return 0;
				if (!a.lastModified) return 1;
				if (!b.lastModified) return -1;
				return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
			});

			return summaries;
		} catch (error) {
			console.error('获取用户摘要列表失败:', error);
			throw error;
		}
	}

	/**
	 * 创建新用户
	 */
	async createUser(uid: string, config: UserConfig, adminId: string): Promise<void> {
		try {
			// 检查用户是否已存在
			const existingConfig = await this.userManager.getUserConfig(uid);
			if (existingConfig) {
				throw new Error(`用户 ${uid} 已存在`);
			}

			// 创建用户配置
			await this.userManager.saveUserConfig(uid, config);

			// 记录操作日志
			await this.logAdminOperation({
				timestamp: new Date().toISOString(),
				operation: 'create_user',
				targetUserId: uid,
				adminId,
				result: 'success',
				details: `创建用户: ${uid}`,
			});
		} catch (error) {
			console.error('创建用户失败:', error);

			// 记录错误日志
			await this.logAdminOperation({
				timestamp: new Date().toISOString(),
				operation: 'create_user',
				targetUserId: uid,
				adminId,
				result: 'error',
				details: `创建用户失败: ${error instanceof Error ? error.message : String(error)}`,
			});

			throw error;
		}
	}

	/**
	 * 删除用户
	 */
	async deleteUser(uid: string, adminId: string): Promise<void> {
		try {
			// 删除用户配置
			await this.userManager.deleteUserConfig(uid);

			// 记录操作日志
			await this.logAdminOperation({
				timestamp: new Date().toISOString(),
				operation: 'delete_user',
				targetUserId: uid,
				adminId,
				result: 'success',
				details: `删除用户: ${uid}`,
			});
		} catch (error) {
			console.error('删除用户失败:', error);

			// 记录错误日志
			await this.logAdminOperation({
				timestamp: new Date().toISOString(),
				operation: 'delete_user',
				targetUserId: uid,
				adminId,
				result: 'error',
				details: `删除用户失败: ${error instanceof Error ? error.message : String(error)}`,
			});

			throw error;
		}
	}

	/**
	 * 批量操作用户
	 */
	async batchOperateUsers(
		userIds: string[],
		operation: 'delete' | 'disable' | 'enable',
		adminId: string
	): Promise<{ success: string[]; failed: string[] }> {
		const success: string[] = [];
		const failed: string[] = [];

		for (const uid of userIds) {
			try {
				switch (operation) {
					case 'delete':
						await this.deleteUser(uid, adminId);
						break;
					case 'disable':
						// 暂时通过删除KV配置来禁用（简化实现）
						await this.userManager.deleteUserConfig(uid);
						break;
					case 'enable':
						// 启用需要恢复默认配置（简化实现）
						break;
				}
				success.push(uid);
			} catch (error) {
				console.error(`批量操作用户 ${uid} 失败:`, error);
				failed.push(uid);
			}
		}

		// 记录批量操作日志
		await this.logAdminOperation({
			timestamp: new Date().toISOString(),
			operation: `batch_${operation}`,
			adminId,
			result: failed.length === 0 ? 'success' : 'error',
			details: `批量${operation}: 成功${success.length}个, 失败${failed.length}个`,
		});

		return { success, failed };
	}


	/**
	 * 记录管理员操作日志
	 */
	private async logAdminOperation(operation: AdminOperation): Promise<void> {
		try {
			const date = new Date().toISOString().split('T')[0];
			const logKey = `admin:logs:${date}`;

			// 获取当日日志
			const existingLogs = await this.env.USERS_KV.get(logKey);
			const logs: AdminOperation[] = existingLogs ? JSON.parse(existingLogs) : [];

			// 添加新日志
			logs.push(operation);

			// 限制单日日志数量（最多1000条）
			if (logs.length > 1000) {
				logs.shift();
			}

			// 保存日志
			await this.env.USERS_KV.put(logKey, JSON.stringify(logs));
		} catch (error) {
			console.error('记录操作日志失败:', error);
		}
	}

	/**
	 * 获取操作日志
	 */
	async getAdminLogs(date?: string, limit: number = 100): Promise<AdminOperation[]> {
		try {
			const targetDate = date || new Date().toISOString().split('T')[0];
			const logKey = `admin:logs:${targetDate}`;

			const logsData = await this.env.USERS_KV.get(logKey);
			if (!logsData) {
				return [];
			}

			const logs: AdminOperation[] = JSON.parse(logsData);

			// 返回最新的日志（限制数量）
			return logs.slice(-limit).reverse();
		} catch (error) {
			console.error('获取操作日志失败:', error);
			return [];
		}
	}

	/**
	 * 获取用户流量信息（从KV缓存）
	 */
	private async getUserTrafficInfo(subscribeUrl: string): Promise<UserSummary['trafficInfo']> {
		try {
			const trafficUtils = new ProxyFetch(subscribeUrl);
			const clashContent = await trafficUtils.fetchFromKV();

			if (!clashContent || !clashContent.subInfo) {
				return undefined;
			}

			return this.parseSubInfo(clashContent.subInfo);
		} catch (error) {
			console.error(`获取用户流量信息失败 (${subscribeUrl}):`, error);
			return undefined;
		}
	}

	/**
	 * 刷新用户流量信息（从远程获取最新数据）
	 */
	async refreshUserTrafficInfo(uid: string, adminId: string): Promise<UserSummary['trafficInfo']> {
		try {
			const configResponse = await this.userManager.getUserConfig(uid);
			if (!configResponse?.config.subscribe) {
				throw new Error(`用户 ${uid} 没有订阅地址`);
			}

			const trafficUtils = new ProxyFetch(configResponse.config.subscribe);
			const { subInfo } = await trafficUtils.fetchClashContent();

			if (!subInfo) {
				throw new Error('无法获取流量信息');
			}

			const trafficInfo = this.parseSubInfo(subInfo);

			// 记录操作日志
			await this.logAdminOperation({
				timestamp: new Date().toISOString(),
				operation: 'refresh_traffic',
				targetUserId: uid,
				adminId,
				result: 'success',
				details: `刷新用户流量信息: ${uid}`,
			});

			return trafficInfo;
		} catch (error) {
			console.error(`刷新用户流量信息失败 (${uid}):`, error);

			// 记录错误日志
			await this.logAdminOperation({
				timestamp: new Date().toISOString(),
				operation: 'refresh_traffic',
				targetUserId: uid,
				adminId,
				result: 'error',
				details: `刷新用户流量信息失败: ${error instanceof Error ? error.message : String(error)}`,
			});

			throw error;
		}
	}

	/**
	 * 解析 subscription-userinfo 字符串
	 * 格式: upload=123456; download=789012; total=21474836480; expire=1640995200
	 */
	private parseSubInfo(subInfo: string): UserSummary['trafficInfo'] {
		try {
			const info: any = {};

			// 解析键值对
			subInfo.split(';').forEach((pair) => {
				const [key, value] = pair.trim().split('=');
				if (key && value) {
					info[key] = parseInt(value, 10);
				}
			});

			const upload = info.upload || 0;
			const download = info.download || 0;
			const total = info.total || 0;
			const used = upload + download;
			const remaining = Math.max(0, total - used);
			const usagePercent = total > 0 ? Math.round((used / total) * 10000) / 100 : 0;
			const expire = info.expire;
			const isExpired = expire ? expire * 1000 < Date.now() : false;

			return {
				upload,
				download,
				total,
				used,
				remaining,
				expire,
				isExpired,
				usagePercent,
			};
		} catch (error) {
			console.error('解析流量信息失败:', error);
			return undefined;
		}
	}

}
