/**
 * Clash 配置数据模型
 * 简化版本，只关注代理节点配置
 */

// Clash 代理节点接口
export interface ClashProxy {
	/** 节点名称 */
	name: string;
	/** 协议类型 */
	type: string;
	/** 服务器地址（直连代理不需要） */
	server?: string;
	/** 端口（直连代理不需要） */
	port?: number;
	/** 密码 */
	password?: string;
	/** 加密方式 */
	cipher?: string;
	/** 是否启用UDP */
	udp?: boolean;

	// SSR 特有字段
	/** 协议 */
	protocol?: string;
	/** 混淆 */
	obfs?: string;
	/** 协议参数 */
	'protocol-param'?: string;
	/** 混淆参数 */
	'obfs-param'?: string;

	// VMess/VLESS 字段
	/** UUID */
	uuid?: string;
	/** AlterID */
	alterId?: number;
	/** 网络类型 */
	network?: string;
	/** 是否启用TLS */
	tls?: boolean;
	/** 跳过证书验证 */
	'skip-cert-verify'?: boolean;
}

// 代理组接口
export interface ClashProxyGroup {
	/** 组名称 */
	name: string;
	/** 组类型 */
	type: string;
	/** 代理节点列表 */
	proxies: string[];
	/** 其他配置 */
	[key: string]: any;
}

// DNS 配置接口
export interface ClashDNS {
	enable?: boolean;
	'enhanced-mode'?: string;
	'use-hosts'?: boolean;
	[key: string]: any;
}

// 实验性功能接口
export interface ClashExperimental {
	'ignore-resolve-fail'?: boolean;
	'sniff-tls-sni'?: boolean;
	[key: string]: any;
}

// 完整的 Clash 配置接口
export interface ClashConfig {
	/** 代理节点 */
	proxies: ClashProxy[];
	/** 代理组 */
	'proxy-groups'?: ClashProxyGroup[];
	/** 接口名称 */
	'interface-name'?: string;
	/** 路由标记 */
	'routing-mark'?: number;
	/** DNS 配置 */
	dns?: ClashDNS;
	/** 实验性功能 */
	experimental?: ClashExperimental;
	/** 其他配置 */
	[key: string]: any;
}

// 配置构建器类
export class ClashConfigBuilder {
	private config: ClashConfig = { proxies: [] };

	/**
	 * 设置代理节点
	 */
	setProxies(proxies: ClashProxy[]): ClashConfigBuilder {
		this.config.proxies = proxies;
		return this;
	}

	/**
	 * 添加代理节点
	 */
	addProxy(proxy: ClashProxy): ClashConfigBuilder {
		this.config.proxies.push(proxy);
		return this;
	}

	/**
	 * 构建配置
	 */
	build(): ClashConfig {
		return { ...this.config };
	}

	/**
	 * 重置构建器
	 */
	reset(): ClashConfigBuilder {
		this.config = { proxies: [] };
		return this;
	}
}
