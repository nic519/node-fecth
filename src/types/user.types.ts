// 地区代码
export type AreaCode = 'TW' | 'SG' | 'JP' | 'VN' | 'HK' | 'US';

// 订阅的配置
export interface SubConfig {
	subscribe: string; // 必需的订阅链接
	flag: string; // 标识，用于区分不同的订阅
	includeArea?: AreaCode[]; // 可选的包含区域, 不填的话就是所有
}

export interface UserConfig {
	subscribe: string; // 订阅地址
	accessToken: string; // 访问令牌
	ruleUrl?: string; // 规则模板链接
	fileName?: string; // 文件名
	multiPortMode?: AreaCode[]; // 多出口模式
	appendSubList?: SubConfig[]; // 追加订阅列表
	excludeRegex?: string; // 需要排除的节点，格式正则表达式. 只有在多端口和多订阅模式下有效
}
