import { parse as yamlParse } from 'yaml';

// 地区代码
export type AreaCode = 'TW' | 'SG' | 'JP' | 'VN' | 'HK' | 'US' | 'ALL' | 'Unknown';

// 订阅的配置
export interface SubConfig {
	subscribe: string; // 必需的订阅链接
	flag: string; // 标识，用于区分不同的订阅
	include?: AreaCode[]; // 可选的包含区域, 不填的话就是所有
}

export interface UserConfig {
	subscribe: string; // 订阅地址
	accessToken: string; // 访问令牌
	ruleUrl?: string; // 规则模板链接
	fileName?: string; // 文件名
	multiPortMode?: AreaCode[]; // 多出口模式
	appendSubList?: SubConfig[]; // 追加订阅列表
}

// 默认配置
const DEFAULT_RULE_URL = 'https://raw.githubusercontent.com/zzy333444/passwall_rule/main/miho-cfg.yaml';

// 用户配置类
export class DBUser {
	readonly subscribe: string;
	readonly accessToken: string;
	readonly ruleUrl: string;
	readonly fileName: string;
	readonly multiPortMode?: AreaCode[];
	readonly appendSubList?: SubConfig[];

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
		this.ruleUrl = config.ruleUrl || DEFAULT_RULE_URL;
		this.fileName = config.fileName || '';
		this.multiPortMode = config.multiPortMode;
		this.appendSubList = config.appendSubList;
	}
}

// 响应头配置
export const RESPONSE_HEADERS = {
	// 指定响应内容的类型为YAML，使用UTF-8编码
	'Content-Type': 'text/yaml; charset=utf-8',

	// 指定Clash配置文件的自动更新间隔（小时）
	'Profile-Update-Interval': '24',

	// 防止浏览器嗅探响应内容类型，增强安全性
	'X-Content-Type-Options': 'nosniff',

	// 防止网页被嵌入到iframe中，防止点击劫持攻击
	'X-Frame-Options': 'DENY',

	// 启用浏览器XSS过滤器，并在检测到攻击时阻止页面加载
	'X-XSS-Protection': '1; mode=block',
};

// 获取特定用户的配置
export const getUserConfig = (env: Env, userId: string): DBUser | null => {
	const users = DBUser.fromEnv(env);
	return users?.[userId] || null;
};
