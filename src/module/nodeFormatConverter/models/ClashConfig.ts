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
	/** 服务器地址 */
	server: string;
	/** 端口 */
	port: number;
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

// 简化的 Clash 配置接口
export interface ClashConfig {
	/** 代理节点 */
	proxies: ClashProxy[];
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
