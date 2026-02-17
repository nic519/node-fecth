import { users, Log, dynamic } from '@/db/schema';
import { desc, inArray, InferSelectModel } from 'drizzle-orm';
import { AdminOperation, UserAdminConfig, SubscriptionStat } from './admin.schema';
import { TrafficInfo, type IUserConfig } from './user.schema';
import { ProxyFetch } from '@/utils/request/proxy-fetch';
import { UserService } from './user.service';
import { DbInstance } from '@/db';
import { createLogService, LogService } from '@/services/log-service';
import { LogLevel } from '@/types/log';

export class AdminService {
	private userService: UserService;
	private logService: LogService;

	constructor(
		private db: DbInstance,
		private superAdminToken: string | undefined
	) {
		this.userService = new UserService(db);
		this.logService = createLogService();
	}

	/**
	 * 验证超级管理员权限
	 */
	async validateSuperAdmin(token: string): Promise<boolean> {
		const superAdminToken = this.superAdminToken;
		if (!superAdminToken) {
			console.warn('SUPER_ADMIN_TOKEN 未配置');
			return false;
		}
		return token === superAdminToken;
	}

	/**
	 * 获取用户列表
	 */
	async getUserSummaryList(): Promise<UserAdminConfig[]> {
		try {
			// 直接从数据库获取所有用户，按更新时间倒序排序
			const userList = await this.db.select().from(users).orderBy(desc(users.updatedAt)).all();

			// 收集所有订阅URL以进行批量查询
			const allUrls = new Set<string>();
			for (const user of userList) {
				const config = user.config;
				if (config.subscribe) {
					allUrls.add(config.subscribe);
				}
				if (user.appendSubList) {
					try {
						const list = JSON.parse(user.appendSubList);
						if (Array.isArray(list)) {
							list.forEach((sub: any) => {
								if (sub.subscribe) allUrls.add(sub.subscribe);
							});
						}
					} catch (e) {
						console.error('Failed to parse appendSubList', e);
					}
				}
			}

			// 查询动态表获取流量信息
			const dynamicMap = new Map<string, InferSelectModel<typeof dynamic>>();
			if (allUrls.size > 0) {
				const dynamicData = await this.db.select().from(dynamic).where(inArray(dynamic.url, Array.from(allUrls))).all();
				dynamicData.forEach((d: InferSelectModel<typeof dynamic>) => dynamicMap.set(d.url, d));
			}

			const summaries: UserAdminConfig[] = [];

			for (const user of userList) {
				const partialConfig = user.config;
				const appendSubList = user.appendSubList ? JSON.parse(user.appendSubList) : undefined;

				// 构建订阅统计信息
				const subscriptionStats: SubscriptionStat[] = [];

				// 主订阅
				if (partialConfig.subscribe) {
					const d = dynamicMap.get(partialConfig.subscribe);
					subscriptionStats.push({
						url: partialConfig.subscribe,
						type: 'main',
						name: '主订阅',
						traffic: d?.traffic || undefined,
						lastUpdated: d?.updatedAt || undefined
					});
				}

				// 附加订阅
				if (appendSubList && Array.isArray(appendSubList)) {
					appendSubList.forEach((sub: any) => {
						if (sub.subscribe) {
							const d = dynamicMap.get(sub.subscribe);
							subscriptionStats.push({
								url: sub.subscribe,
								type: 'append',
								name: sub.flag || '附加订阅',
								traffic: d?.traffic || undefined,
								lastUpdated: d?.updatedAt || undefined
							});
						}
					});
				}

				// 合并数据库字段到配置对象
				const config: UserAdminConfig = {
					...partialConfig,
					uid: user.id,
					updatedAt: user.updatedAt,
					accessToken: user.accessToken,
					requiredFilters: user.requiredFilters || undefined,
					ruleUrl: user.ruleUrl || undefined,
					fileName: user.fileName || undefined,
					appendSubList: appendSubList,
					subscriptionStats
				};
				summaries.push(config);
			}

			return summaries;
		} catch (error) {
			console.error('获取用户列表失败:', error);
			throw error;
		}
	}

	/**
	 * 创建新用户
	 */
	async createUser(uid: string, config: IUserConfig, adminId: string): Promise<void> {
		try {
			// 检查用户是否已存在
			const existingConfig = await this.userService.getUserConfig(uid);
			if (existingConfig) {
				throw new Error(`用户 ${uid} 已存在`);
			}

			// 创建用户配置
			await this.userService.saveUserConfig(uid, config);

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
			await this.userService.deleteUserConfig(uid);

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
						await this.userService.deleteUserConfig(uid);
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
		const level: LogLevel = operation.result === 'error' ? 'error' : 'audit';

		await this.logService.log({
			level,
			type: operation.operation,
			message: operation.details || operation.operation,
			userId: operation.adminId,
			meta: operation
		});
	}

	/**
	 * 获取操作日志
	 */
	async getAdminLogs(date?: string, limit: number = 100): Promise<AdminOperation[]> {
		// 适配 LogService 查询
		const logs = await this.logService.queryLogs({
			limit,
			level: 'audit',
			startTime: date ? new Date(date) : undefined
		});

		return logs.data.map((log: Log) => {
			const meta = (log.meta as Record<string, any>) || {};
			return {
				timestamp: log.createdAt,
				operation: log.type,
				adminId: log.userId || '',
				result: log.level === 'error' ? 'error' : 'success',
				details: log.message,
				...meta
			} as AdminOperation;
		});
	}

	/**
	 * 刷新用户流量信息（从远程获取最新数据）
	 */
	async refreshUserTrafficInfo(uid: string, adminId: string): Promise<TrafficInfo | undefined> {
		try {
			const configResponse = await this.userService.getUserConfig(uid);
			if (!configResponse?.subscribe) {
				throw new Error(`用户 ${uid} 没有订阅地址`);
			}

			const trafficUtils = new ProxyFetch(configResponse.subscribe);
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
	private parseSubInfo(subInfo: string): TrafficInfo | undefined {
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
