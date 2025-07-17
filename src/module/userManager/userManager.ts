import { ConfigResponse, UserConfig, UserConfigMeta, UserConfigSchema } from '@/types/openapi-schemas';
import { parse as yamlParse } from 'yaml';

export class UserManager {
	private env: Env;

	private kvUserConfigKey(uid: string) {
		return `user:${uid}:config`;
	}
	private kvUserMetaKey(uid: string) {
		return `user:${uid}:meta`;
	}

	constructor(env: Env) {
		this.env = env;
	}

	/**
	 * 获取用户配置（优先级：KV > 环境变量）
	 */
	async getUserConfig(uid: string): Promise<ConfigResponse | null> {
		try {
			// 1. 尝试从KV获取配置
			const kvConfig = await this.getConfigFromKV(uid);
			if (kvConfig) {
				return kvConfig;
			}

			// 2. 从环境变量获取配置
			const envConfig = this.getConfigFromEnv(uid);
			if (envConfig) {
				return {
					config: envConfig,
					meta: { lastModified: new Date().toISOString(), source: 'env' as const, uid: uid },
				};
			}

			return null;
		} catch (error) {
			console.error(`获取用户配置失败: ${uid}`, error);
			return null;
		}
	}

	/**
	 * 从KV存储获取用户配置
	 */
	private async getConfigFromKV(uid: string): Promise<ConfigResponse | null> {
		try {
			const configKey = this.kvUserConfigKey(uid);
			const metaKey = this.kvUserMetaKey(uid);

			const [configData, metaData] = await Promise.all([this.env.USERS_KV.get(configKey), this.env.USERS_KV.get(metaKey)]);

			if (!configData) return null;

			const config = JSON.parse(configData) as UserConfig;
			const meta = metaData
				? (JSON.parse(metaData) as UserConfigMeta)
				: {
						lastModified: new Date().toISOString(),
						source: 'kv' as const,
						uid: uid,
				  };

			return { config, meta };
		} catch (error) {
			console.error(`从KV获取配置失败: ${uid}`, error);
			return null;
		}
	}

	/**
	 * 从环境变量获取用户配置
	 */
	private getConfigFromEnv(uid: string): UserConfig | null {
		try {
			const envUser = this.env.DB_USER;
			if (!envUser) return null;

			const users = yamlParse(envUser) as Record<string, UserConfig>;
			return users[uid] || null;
		} catch (error) {
			console.error(`从环境变量获取配置失败: ${uid}`, error);
			return null;
		}
	}

	/**
	 * 保存用户配置到KV存储
	 */
	async saveUserConfig(uid: string, config: UserConfig): Promise<boolean> {
		try {
			// 验证配置
			if (!this.validateConfigFormat(config)) {
				throw new Error('用户配置验证失败');
			}

			const configKey = this.kvUserConfigKey(uid);
			const metaKey = this.kvUserMetaKey(uid);

			const meta: UserConfigMeta = {
				lastModified: new Date().toISOString(),
				source: 'kv',
				uid,
			};

			await Promise.all([this.env.USERS_KV.put(configKey, JSON.stringify(config)), this.env.USERS_KV.put(metaKey, JSON.stringify(meta))]);

			console.log(`✅ 用户配置保存成功: ${uid}`);
			return true;
		} catch (error) {
			console.error(`保存用户配置失败: ${uid}`, error);
			return false;
		}
	}

	/**
	 * 删除用户配置
	 */
	async deleteUserConfig(uid: string): Promise<boolean> {
		try {
			const configKey = `user:${uid}:config`;
			const metaKey = `user:${uid}:meta`;

			await Promise.all([this.env.USERS_KV.delete(configKey), this.env.USERS_KV.delete(metaKey)]);

			console.log(`✅ 用户配置删除成功: ${uid}`);
			return true;
		} catch (error) {
			console.error(`删除用户配置失败: ${uid}`, error);
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
			const envUsers = this.env.DB_USER;
			if (!envUsers) return [];

			const users = yamlParse(envUsers) as Record<string, UserConfig>;
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
	private validateConfigFormat(config: UserConfig): boolean {
		console.log('🔍 开始验证用户配置:', JSON.stringify(config, null, 2));

		try {
			UserConfigSchema.parse(config);
			console.log('✅ 用户配置验证通过');
			return true;
		} catch (error) {
			console.log('❌ 用户配置验证失败:', error);
			return false;
		}
	}

	/**
	 * 验证用户token并获取用户配置（支持KV存储）
	 * @param uid 用户ID
	 * @param accessToken 访问token
	 * @returns 验证通过返回ConfigResponse，验证失败返回null
	 */
	async validateAndGetUser(uid: string, accessToken: string): Promise<ConfigResponse | null> {
		if (!uid || !accessToken) {
			console.log('🔒 验证失败: 缺少参数 userId 或 accessToken');
			return null;
		}

		try {
			const userConfigResponse = await this.getUserConfig(uid);

			if (!userConfigResponse) {
				console.log(`🔒 验证失败: 用户配置不存在 - ${uid}`);
				return null;
			}

			const { config } = userConfigResponse;

			if (accessToken !== config.accessToken) {
				console.log(`🔒 验证失败: token 无效 - ${uid}`);
				return null;
			}

			console.log(`✅ 用户验证成功: ${uid} (来源: ${userConfigResponse.meta.source})`);
			return userConfigResponse;
		} catch (error) {
			console.error(`❌ 验证用户token失败: ${uid}`, error);
			return null;
		}
	}
}
