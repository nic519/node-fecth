import { UserConfig } from '@/types/openapi-schemas';
import { UserManager } from './userManager';
import { TrafficUtils } from '@/utils/trafficUtils';
import { SuperAdminStats, UserSummary, ConfigTemplate, AdminOperation } from '@/module/userManager/types/supper-admin.types';


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
			for (const userId of userList) {
				const configResponse = await this.userManager.getUserConfig(userId);
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

			const configCompleteRate = userList.length > 0 
				? ((kvConfigUsers + envConfigUsers) / userList.length) * 100 
				: 0;

			return {
				totalUsers: userList.length,
				activeUsers,
				kvConfigUsers,
				envConfigUsers,
				configCompleteRate: Math.round(configCompleteRate * 100) / 100,
				todayNewUsers
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

			for (const userId of userList) {
				const configResponse = await this.userManager.getUserConfig(userId);
				const subscribeUrl = configResponse?.config.subscribe;
				
				// 获取流量信息（仅当有订阅地址时）
				let trafficInfo: UserSummary['trafficInfo'] = undefined;
				if (subscribeUrl) {
					try {
						trafficInfo = await this.getUserTrafficInfo(subscribeUrl);
					} catch (error) {
						console.warn(`获取用户 ${userId} 流量信息失败:`, error);
					}
				}

				const summary: UserSummary = {
					userId,
					token: configResponse?.config.accessToken || '',
					hasConfig: !!configResponse,
					source: configResponse?.meta.source || 'none',
					lastModified: configResponse?.meta.lastModified || null,
					isActive: !!(configResponse?.config.subscribe && configResponse?.config.accessToken),
					subscribeUrl,
					status: configResponse ? 'active' : 'inactive',
					trafficInfo
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
	async createUser(userId: string, config: UserConfig, adminId: string): Promise<void> {
		try {
			// 检查用户是否已存在
			const existingConfig = await this.userManager.getUserConfig(userId);
			if (existingConfig) {
				throw new Error(`用户 ${userId} 已存在`);
			}

			// 创建用户配置
			await this.userManager.saveUserConfig(userId, config);

			// 记录操作日志
			await this.logAdminOperation({
				timestamp: new Date().toISOString(),
				operation: 'create_user',
				targetUserId: userId,
				adminId,
				result: 'success',
				details: `创建用户: ${userId}`
			});
		} catch (error) {
			console.error('创建用户失败:', error);
			
			// 记录错误日志
			await this.logAdminOperation({
				timestamp: new Date().toISOString(),
				operation: 'create_user',
				targetUserId: userId,
				adminId,
				result: 'error',
				details: `创建用户失败: ${error instanceof Error ? error.message : String(error)}`
			});
			
			throw error;
		}
	}

	/**
	 * 删除用户
	 */
	async deleteUser(userId: string, adminId: string): Promise<void> {
		try {
			// 删除用户配置
			await this.userManager.deleteUserConfig(userId);

			// 记录操作日志
			await this.logAdminOperation({
				timestamp: new Date().toISOString(),
				operation: 'delete_user',
				targetUserId: userId,
				adminId,
				result: 'success',
				details: `删除用户: ${userId}`
			});
		} catch (error) {
			console.error('删除用户失败:', error);
			
			// 记录错误日志
			await this.logAdminOperation({
				timestamp: new Date().toISOString(),
				operation: 'delete_user',
				targetUserId: userId,
				adminId,
				result: 'error',
				details: `删除用户失败: ${error instanceof Error ? error.message : String(error)}`
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
	): Promise<{ success: string[], failed: string[] }> {
		const success: string[] = [];
		const failed: string[] = [];

		for (const userId of userIds) {
			try {
				switch (operation) {
					case 'delete':
						await this.deleteUser(userId, adminId);
						break;
					case 'disable':
						// 暂时通过删除KV配置来禁用（简化实现）
						await this.userManager.deleteUserConfig(userId);
						break;
					case 'enable':
						// 启用需要恢复默认配置（简化实现）
						break;
				}
				success.push(userId);
			} catch (error) {
				console.error(`批量操作用户 ${userId} 失败:`, error);
				failed.push(userId);
			}
		}

		// 记录批量操作日志
		await this.logAdminOperation({
			timestamp: new Date().toISOString(),
			operation: `batch_${operation}`,
			adminId,
			result: failed.length === 0 ? 'success' : 'error',
			details: `批量${operation}: 成功${success.length}个, 失败${failed.length}个`
		});

		return { success, failed };
	}

	/**
	 * 获取配置模板列表
	 */
	async getConfigTemplates(): Promise<ConfigTemplate[]> {
		try {
			const templatesKey = 'admin:templates:list';
			const templatesData = await this.env.USERS_KV.get(templatesKey);
			
			if (!templatesData) {
				// 返回默认模板
				return [this.getDefaultTemplate()];
			}

			const templates: ConfigTemplate[] = JSON.parse(templatesData);
			return templates;
		} catch (error) {
			console.error('获取配置模板失败:', error);
			return [this.getDefaultTemplate()];
		}
	}

	/**
	 * 创建配置模板
	 */
	async createConfigTemplate(template: Omit<ConfigTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<ConfigTemplate> {
		try {
			const newTemplate: ConfigTemplate = {
				...template,
				id: `template_${Date.now()}`,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				usageCount: 0
			};

			// 获取现有模板
			const templates = await this.getConfigTemplates();
			templates.push(newTemplate);

			// 保存模板列表
			const templatesKey = 'admin:templates:list';
			await this.env.USERS_KV.put(templatesKey, JSON.stringify(templates));

			return newTemplate;
		} catch (error) {
			console.error('创建配置模板失败:', error);
			throw error;
		}
	}

	/**
	 * 应用模板到用户
	 */
	async applyTemplateToUser(templateId: string, userId: string, adminId: string): Promise<void> {
		try {
			const templates = await this.getConfigTemplates();
			const template = templates.find(t => t.id === templateId);
			
			if (!template) {
				throw new Error(`模板 ${templateId} 不存在`);
			}

			// 获取用户当前配置
			const currentConfig = await this.userManager.getUserConfig(userId);
			
			// 合并模板配置（保留用户的必要字段如accessToken）
			const mergedConfig: UserConfig = {
				...template.template,
				subscribe: template.template.subscribe || currentConfig?.config.subscribe || '',
				accessToken: currentConfig?.config.accessToken || ''
			} as UserConfig;

			// 更新用户配置
			await this.userManager.saveUserConfig(userId, mergedConfig);

			// 更新模板使用计数
			template.usageCount++;
			template.updatedAt = new Date().toISOString();
			
			const templatesKey = 'admin:templates:list';
			await this.env.USERS_KV.put(templatesKey, JSON.stringify(templates));

			// 记录操作日志
			await this.logAdminOperation({
				timestamp: new Date().toISOString(),
				operation: 'apply_template',
				targetUserId: userId,
				adminId,
				result: 'success',
				details: `应用模板 ${template.name} 到用户 ${userId}`
			});
		} catch (error) {
			console.error('应用模板失败:', error);
			throw error;
		}
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
			const trafficUtils = new TrafficUtils(subscribeUrl);
			const clashContent = await trafficUtils.fetchFromKV(false);
			
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
	async refreshUserTrafficInfo(userId: string, adminId: string): Promise<UserSummary['trafficInfo']> {
		try {
			const configResponse = await this.userManager.getUserConfig(userId);
			if (!configResponse?.config.subscribe) {
				throw new Error(`用户 ${userId} 没有订阅地址`);
			}

			const trafficUtils = new TrafficUtils(configResponse.config.subscribe);
			const { subInfo } = await trafficUtils.fetchClashContent();
			
			if (!subInfo) {
				throw new Error('无法获取流量信息');
			}

			const trafficInfo = this.parseSubInfo(subInfo);

			// 记录操作日志
			await this.logAdminOperation({
				timestamp: new Date().toISOString(),
				operation: 'refresh_traffic',
				targetUserId: userId,
				adminId,
				result: 'success',
				details: `刷新用户流量信息: ${userId}`
			});

			return trafficInfo;
		} catch (error) {
			console.error(`刷新用户流量信息失败 (${userId}):`, error);
			
			// 记录错误日志
			await this.logAdminOperation({
				timestamp: new Date().toISOString(),
				operation: 'refresh_traffic',
				targetUserId: userId,
				adminId,
				result: 'error',
				details: `刷新用户流量信息失败: ${error instanceof Error ? error.message : String(error)}`
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
			subInfo.split(';').forEach(pair => {
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
			const isExpired = expire ? (expire * 1000 < Date.now()) : false;

			return {
				upload,
				download,
				total,
				used,
				remaining,
				expire,
				isExpired,
				usagePercent
			};
		} catch (error) {
			console.error('解析流量信息失败:', error);
			return undefined;
		}
	}

	/**
	 * 获取默认配置模板
	 */
	private getDefaultTemplate(): ConfigTemplate {
		return {
			id: 'default',
			name: '默认模板',
			description: '新用户的默认配置模板',
			template: {
				subscribe: '',
				accessToken: '',
				ruleUrl: 'https://example.com/rules',
				fileName: 'config.yaml',
				multiPortMode: ['TW', 'SG', 'JP'],
				excludeRegex: ''
			},
			isDefault: true,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			usageCount: 0
		};
	}
} 