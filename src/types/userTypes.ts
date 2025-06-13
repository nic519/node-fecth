import { parse as yamlParse } from 'yaml';

// 单个用户配置接口（原始配置，字段可选）
export interface DBUser {
	subscribe: string; // 必需的订阅链接
	accessToken: string; // 必需的访问令牌
	ruleUrl?: string; // 可选的规则链接
	fileName?: string; // 可选的文件名
	mode?: number; // 可选的模式
}

// 处理后的用户配置接口（所有字段都有默认值）
export interface ProcessedDBUser {
	subscribe: string; // 必需的订阅链接
	accessToken: string; // 必需的访问令牌
	ruleUrl: string; // 处理后必有值
	fileName: string; // 处理后必有值
	mode: number; // 处理后必有值
}

// 默认配置
const DEFAULT_RULE_URL = 'https://raw.githubusercontent.com/zzy333444/passwall_rule/main/miho-cfg.yaml';

// 获取特定用户的配置，返回所有字段都有值的完整配置
export const getUserConfig = (env: Env, userId: string): ProcessedDBUser | null => {
	try {
		// 检查环境变量是否存在
		if (!env.DB_USER) {
			console.error('DB_USER environment variable is not set');
			return null;
		}

		// 处理本地开发环境中的字符串类型
		const configs = yamlParse(env.DB_USER);

		const userConfig = configs[userId];
		if (!userConfig) return null;

		return {
			subscribe: userConfig.subscribe,
			accessToken: userConfig.accessToken,
			ruleUrl: userConfig.ruleUrl || DEFAULT_RULE_URL,
			fileName: userConfig.fileName || userId,
			mode: userConfig.mode || 0,
		};
	} catch (error) {
		console.error('Failed to process DB_USER:', error);
		return null;
	}
};

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
