import { GlobalConfig } from '@/config/global-config';
import { AreaCode, SubConfig, UserConfig } from '@/types/user.types';
import { parse as yamlParse } from 'yaml';

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

	private constructor(config: UserConfig) {
		this.subscribe = config.subscribe;
		this.accessToken = config.accessToken;
		this.ruleUrl = config.ruleUrl || GlobalConfig.ruleUrl;
		this.fileName = config.fileName || '';
		this.multiPortMode = config.multiPortMode;
		this.appendSubList = config.appendSubList;
		this.excludeRegex = config.excludeRegex;
	}
}

export class UserManager {
	static get(env: Env, userId: string): DBUser | null {
		const users = DBUser.fromEnv(env);
		return users?.[userId] || null;
	}
}
