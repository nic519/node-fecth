/**
 * 数据模型导出文件
 */

// 代理节点模型
export * from './ProxyNode';

// Clash 配置模型
export * from './ClashConfig';

// 订阅相关模型
export interface SubscriptionInfo {
	/** 订阅名称 */
	name?: string;
	/** 订阅URL */
	url?: string;
	/** 用户代理 */
	userAgent?: string;
	/** 更新间隔（秒） */
	updateInterval?: number;
	/** 节点总数 */
	totalNodes: number;
	/** 有效节点数 */
	validNodes: number;
	/** 地区分布 */
	regions: Record<string, number>;
	/** 协议分布 */
	protocols: Record<string, number>;
	/** 最后更新时间 */
	lastUpdate?: Date;
}

// 转换结果模型
export interface ConversionResult<T = string> {
	/** 转换是否成功 */
	success: boolean;
	/** 转换结果数据 */
	data?: T;
	/** 错误信息 */
	error?: string;
	/** 节点统计信息 */
	stats?: SubscriptionInfo;
	/** 警告信息 */
	warnings?: string[];
}

// 转换选项模型
export interface ConversionOptions {
	/** 包含直连代理 */
	includeDirectProxy?: boolean;
	/** 启用UDP */
	enableUDP?: boolean;
	/** 过滤器 */
	filter?: {
		/** 包含关键词 */
		include?: string[];
		/** 排除关键词 */
		exclude?: string[];
		/** 协议过滤 */
		protocols?: string[];
	};
	/** 输出格式 */
	outputFormat?: 'yaml' | 'json';
}

// 解析器选项模型
export interface ParserOptions {
	/** 严格模式 */
	strictMode?: boolean;
	/** 跳过无效节点 */
	skipInvalidNodes?: boolean;
	/** 最大节点数量 */
	maxNodes?: number;
	/** 超时时间（毫秒） */
	timeout?: number;
}

// 地区信息模型
export interface RegionInfo {
	/** 地区代码 */
	code: string;
	/** 地区名称 */
	name: string;
	/** 地区标志 */
	flag: string;
	/** 匹配关键词 */
	keywords: string[];
}

// 预定义地区信息
export const REGIONS: RegionInfo[] = [
	{
		code: 'HK',
		name: '香港',
		flag: '🇭🇰',
		keywords: ['香港', 'HK', 'Hong Kong', 'hk', 'hongkong'],
	},
	{
		code: 'TW',
		name: '台湾',
		flag: '🇨🇳',
		keywords: ['台湾', 'TW', 'Taiwan', 'tw', 'taiwan'],
	},
	{
		code: 'JP',
		name: '日本',
		flag: '🇯🇵',
		keywords: ['日本', 'JP', 'Japan', 'jp', 'japan'],
	},
	{
		code: 'KR',
		name: '韩国',
		flag: '🇰🇷',
		keywords: ['韩国', 'KR', 'Korea', 'kr', 'korea'],
	},
	{
		code: 'SG',
		name: '新加坡',
		flag: '🇸🇬',
		keywords: ['新加坡', 'SG', 'Singapore', 'sg', 'singapore'],
	},
	{
		code: 'US',
		name: '美国',
		flag: '🇺🇸',
		keywords: ['美国', 'US', 'USA', 'America', 'us', 'america'],
	},
	{
		code: 'UK',
		name: '英国',
		flag: '🇬🇧',
		keywords: ['英国', 'UK', 'Britain', 'uk', 'britain', 'england'],
	},
	{
		code: 'DE',
		name: '德国',
		flag: '🇩🇪',
		keywords: ['德国', 'DE', 'Germany', 'de', 'germany'],
	},
	{
		code: 'FR',
		name: '法国',
		flag: '🇫🇷',
		keywords: ['法国', 'FR', 'France', 'fr', 'france'],
	},
	{
		code: 'CA',
		name: '加拿大',
		flag: '🇨🇦',
		keywords: ['加拿大', 'CA', 'Canada', 'ca', 'canada'],
	},
	{
		code: 'AU',
		name: '澳洲',
		flag: '🇦🇺',
		keywords: ['澳洲', 'AU', 'Australia', 'au', 'australia'],
	},
	{
		code: 'RU',
		name: '俄罗斯',
		flag: '🇷🇺',
		keywords: ['俄罗斯', 'RU', 'Russia', 'ru', 'russia'],
	},
	{
		code: 'IN',
		name: '印度',
		flag: '🇮🇳',
		keywords: ['印度', 'IN', 'India', 'in', 'india'],
	},
	{
		code: 'NL',
		name: '荷兰',
		flag: '🇳🇱',
		keywords: ['荷兰', 'NL', 'Netherlands', 'nl', 'netherlands'],
	},
];

// 地区检测工具
export class RegionDetector {
	/**
	 * 从节点名称检测地区
	 */
	static detectRegion(nodeName: string): RegionInfo | null {
		const lowerName = nodeName.toLowerCase();

		for (const region of REGIONS) {
			for (const keyword of region.keywords) {
				if (lowerName.includes(keyword.toLowerCase())) {
					return region;
				}
			}
		}

		return null;
	}

	/**
	 * 获取地区标识符（带标志）
	 */
	static getRegionLabel(nodeName: string): string {
		const region = this.detectRegion(nodeName);
		return region ? `${region.flag} ${region.name}` : '🌍 其他';
	}

	/**
	 * 按地区分组节点
	 */
	static groupByRegion<T extends { name: string }>(nodes: T[]): Map<string, T[]> {
		const groups = new Map<string, T[]>();

		for (const node of nodes) {
			const regionLabel = this.getRegionLabel(node.name);

			if (!groups.has(regionLabel)) {
				groups.set(regionLabel, []);
			}

			groups.get(regionLabel)!.push(node);
		}

		return groups;
	}
}
