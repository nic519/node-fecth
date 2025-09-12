import { AreaCode } from '@/types/openapi-schemas';

export interface ClashYaml {
	proxies: ClashProxy[];
	listeners?: ClashListener[];
}

export interface ClashProxy {
	name: string;
	type: string;
	server: string;
	port: number;
	password?: string;
	cipher?: string;
	udp?: boolean;
	obfs?: string;
	'obfs-param'?: string;
	protocol?: string;
	'protocol-param'?: string;
	sni?: string;
	'skip-cert-verify'?: boolean;
}

export interface ClashListener {
	name: string;
	type: string;
	port: number;
	proxy: string;
}

export interface ProxyAreaInfo {
	// 显示名称
	code: AreaCode;
	// 正则匹配条件
	regex: string;
	// 端口相对起点，作用：把地区的端口范围固定
	startPort: number;
}

export interface SubInfo {
	upload: number;
	download: number;
	total: number;
	expire: number;
}

// SSR订阅相关类型定义
export interface SSRSubscriptionNode {
	server: string;
	port: number;
	protocol: string;
	method: string;
	obfs: string;
	password: string;
	obfsParam?: string;
	protocolParam?: string;
	remarks?: string;
	group?: string;
}

export interface SSRSubscriptionInfo {
	totalNodes: number;
	validNodes: number;
	regions: Record<string, number>;
	protocols: Record<string, number>;
	ciphers: Record<string, number>;
}

export interface ConversionResult {
	success: boolean;
	clashYaml?: string;
	nodeCount?: number;
	errorMessage?: string;
	stats?: SSRSubscriptionInfo;
}
