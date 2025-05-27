// 单个用户配置接口
export interface UserConfig {
	SUB_URL: string;          // 必需的订阅链接
	ACCESS_TOKEN: string;     // 必需的访问令牌 
	RULE_URL?: string;        // 可选的规则链接
	FILE_NAME?: string;       // 可选的文件名
	MODE?: number;            // 可选的模式
}

// 默认配置
export const DEFAULT_CONFIG = { 
	// RULE_URL: 'https://raw.githubusercontent.com/zzy333444/passwall_rule/main/config.ini'
	RULE_URL: 'https://raw.githubusercontent.com/zzy333444/passwall_rule/main/miho-cfg.yaml'
} as const;
 
 

// 获取特定用户的配置
export const getUserConfig = (env: Env, userId: string): UserConfig | null => {
	try {
		// 处理本地开发环境中的字符串类型
		const configs = typeof env.USER_CONFIGS === 'string' 
			? JSON.parse(env.USER_CONFIGS) 
			: env.USER_CONFIGS;
		
		const userConfig = configs[userId];
		if (!userConfig) return null;
		
		return {
			...DEFAULT_CONFIG,  // 先展开默认配置
			...userConfig,      // 再展开用户配置，会覆盖默认值
			FILE_NAME: userConfig.FILE_NAME || 'clash',
			MODE: userConfig.MODE || 0
		};
	} catch (error) {
		console.error('Failed to process USER_CONFIGS:', error);
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
	'X-XSS-Protection': '1; mode=block'
};

// 订阅参数配置
export const SUB_PARAMS = {
	options: {
		emoji: true,
		list: false,
		xudp: false,
		udp: false,
		tfo: false,
		expand: true,
		scv: false,
		fdn: false,
		new_name: true
	}
};