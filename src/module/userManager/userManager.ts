import { GlobalConfig } from '@/config/global-config';
import { AreaCode, SubConfig, UserConfig } from '@/types/user.types';
import { parse as yamlParse } from 'yaml';
import { AuthUtils } from '@/utils/authUtils';

// 用户配置类
export class DBUser {
	readonly subscribe: string;
	readonly accessToken: string;
	readonly ruleUrl: string;
	readonly fileName: string;
	readonly multiPortMode?: AreaCode[];
	readonly appendSubList?: SubConfig[];
	readonly excludeRegex?: string;

	// 从环境变量解析所有用户配置
	static fromEnv(env: Env): Record<string, DBUser> | null {
		try {
			if (!env.DB_USER) {
				console.error('DB_USER environment variable is not set');
				return null;
			}
			const configs = yamlParse(env.DB_USER) as Record<string, any>;

			const users: Record<string, DBUser> = {};

			for (const [userId, config] of Object.entries(configs)) {
				users[userId] = new DBUser({
					...config,
					fileName: config.fileName || userId,
				});
			}

			return users;
		} catch (error) {
			console.error('Failed to parse DB_USER:', error);
			return null;
		}
	}

	constructor(config: UserConfig) {
		this.subscribe = config.subscribe;
		this.accessToken = config.accessToken;
		this.ruleUrl = config.ruleUrl || GlobalConfig.ruleUrl;
		this.fileName = config.fileName || '';
		this.multiPortMode = config.multiPortMode;
		this.appendSubList = config.appendSubList;
		this.excludeRegex = config.excludeRegex;
	}
}

export interface UserConfigMeta {
	lastModified: string;
	source: 'kv' | 'env';
	userId: string;
}

export interface UserConfigResponse {
	config: UserConfig;
	meta: UserConfigMeta;
}

export class UserManager {
	private env: Env;

	constructor(env: Env) {
		this.env = env;
	}

	/**
	 * 获取用户配置（优先级：KV > 环境变量）
	 */
	async getUserConfig(userId: string): Promise<UserConfigResponse | null> {
		try {
			// 1. 尝试从KV获取配置
			const kvConfig = await this.getConfigFromKV(userId);
			if (kvConfig) {
				return {
					config: kvConfig.config,
					meta: {
						lastModified: kvConfig.meta.lastModified,
						source: 'kv' as const,
						userId,
					},
				};
			}

			// 2. 从环境变量获取配置
			const envConfig = this.getConfigFromEnv(userId);
			if (envConfig) {
				return {
					config: envConfig,
					meta: {
						lastModified: new Date().toISOString(),
						source: 'env' as const,
						userId,
					},
				};
			}

			return null;
		} catch (error) {
			console.error(`获取用户配置失败: ${userId}`, error);
			return null;
		}
	}

	/**
	 * 从KV存储获取用户配置
	 */
	private async getConfigFromKV(userId: string): Promise<{ config: UserConfig; meta: UserConfigMeta } | null> {
		try {
			const configKey = `user:${userId}:config`;
			const metaKey = `user:${userId}:meta`;

			const [configData, metaData] = await Promise.all([this.env.USERS_KV.get(configKey), this.env.USERS_KV.get(metaKey)]);

			if (!configData) return null;

			const config = JSON.parse(configData) as UserConfig;
			const meta = metaData
				? (JSON.parse(metaData) as UserConfigMeta)
				: {
						lastModified: new Date().toISOString(),
						source: 'kv' as const,
						userId,
				  };

			return { config, meta };
		} catch (error) {
			console.error(`从KV获取配置失败: ${userId}`, error);
			return null;
		}
	}

	/**
	 * 从环境变量获取用户配置
	 */
	private getConfigFromEnv(userId: string): UserConfig | null {
		try {
			const dbUser = this.env.DB_USER;
			if (!dbUser) return null;

			const users = yamlParse(dbUser) as Record<string, UserConfig>;
			return users[userId] || null;
		} catch (error) {
			console.error(`从环境变量获取配置失败: ${userId}`, error);
			return null;
		}
	}

	/**
	 * 保存用户配置到KV存储
	 */
	async saveUserConfig(userId: string, config: UserConfig): Promise<boolean> {
		try {
			// 验证配置
			if (!this.validateUserConfig(config)) {
				throw new Error('用户配置验证失败');
			}

			const configKey = `user:${userId}:config`;
			const metaKey = `user:${userId}:meta`;

			const meta: UserConfigMeta = {
				lastModified: new Date().toISOString(),
				source: 'kv',
				userId,
			};

			await Promise.all([this.env.USERS_KV.put(configKey, JSON.stringify(config)), this.env.USERS_KV.put(metaKey, JSON.stringify(meta))]);

			console.log(`✅ 用户配置保存成功: ${userId}`);
			return true;
		} catch (error) {
			console.error(`保存用户配置失败: ${userId}`, error);
			return false;
		}
	}

	/**
	 * 删除用户配置
	 */
	async deleteUserConfig(userId: string): Promise<boolean> {
		try {
			const configKey = `user:${userId}:config`;
			const metaKey = `user:${userId}:meta`;

			await Promise.all([this.env.USERS_KV.delete(configKey), this.env.USERS_KV.delete(metaKey)]);

			console.log(`✅ 用户配置删除成功: ${userId}`);
			return true;
		} catch (error) {
			console.error(`删除用户配置失败: ${userId}`, error);
			return false;
		}
	}

	/**
	 * 获取所有用户列表
	 */
	async getAllUsers(): Promise<string[]> {
		try {
			// 从环境变量获取默认用户列表
			const envUsers = this.getEnvUsersList();

			// 从KV获取额外用户列表
			const kvUsers = await this.getKVUsersList();

			// 合并去重
			const allUsers = new Set([...envUsers, ...kvUsers]);
			return Array.from(allUsers).sort();
		} catch (error) {
			console.error('获取用户列表失败', error);
			return [];
		}
	}

	/**
	 * 从环境变量获取用户列表
	 */
	private getEnvUsersList(): string[] {
		try {
			const dbUser = this.env.DB_USER;
			if (!dbUser) return [];

			const users = yamlParse(dbUser) as Record<string, UserConfig>;
			return Object.keys(users);
		} catch (error) {
			console.error('从环境变量获取用户列表失败', error);
			return [];
		}
	}

	/**
	 * 从KV获取用户列表
	 */
	private async getKVUsersList(): Promise<string[]> {
		try {
			const list = await this.env.USERS_KV.list({ prefix: 'user:' });
			const users = new Set<string>();

			for (const key of list.keys) {
				if (key.name.endsWith(':config')) {
					const userId = key.name.replace('user:', '').replace(':config', '');
					users.add(userId);
				}
			}

			return Array.from(users);
		} catch (error) {
			console.error('从KV获取用户列表失败', error);
			return [];
		}
	}

	/**
	 * 验证用户配置
	 */
	private validateUserConfig(config: UserConfig): boolean {
		// 必填字段验证
		if (!config.subscribe || !config.accessToken) {
			return false;
		}

		// URL格式验证
		try {
			new URL(config.subscribe);
		} catch {
			return false;
		}

		// 可选字段验证
		if (config.ruleUrl) {
			try {
				new URL(config.ruleUrl);
			} catch {
				return false;
			}
		}

		// 多端口模式验证
		if (config.multiPortMode && !Array.isArray(config.multiPortMode)) {
			return false;
		}

		// 追加订阅列表验证
		if (config.appendSubList && !Array.isArray(config.appendSubList)) {
			return false;
		}

		return true;
	}

	/**
	 * 验证用户权限
	 */
	validateUserPermission(userId: string, accessToken: string): boolean {
		try {
			// 使用现有的AuthUtils验证token
			const authResult = AuthUtils.validateToken(this.env, userId, accessToken);
			return !(authResult instanceof Response);
		} catch (error) {
			console.error(`验证用户权限失败: ${userId}`, error);
			return false;
		}
	}

	/**
	 * 静态方法：获取用户配置（向后兼容）
	 */
	static get(env: Env, userId: string): DBUser | null {
		try {
			const dbUser = env.DB_USER;
			if (!dbUser) return null;

			const users = yamlParse(dbUser) as Record<string, any>;
			const config = users[userId];
			if (!config) return null;

			return new DBUser(config);
		} catch (error) {
			console.error(`获取用户配置失败: ${userId}`, error);
			return null;
		}
	}
}
