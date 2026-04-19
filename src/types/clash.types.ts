import type { AreaCode } from '@/types/api-schemas';

/**
 * Clash 配置根结构。
 *
 * 描述转换后的 Clash YAML 中本模块关心的代理和监听器字段。
 */
export interface ClashYaml {
	// 代理节点列表。
	proxies: ClashProxy[];
	// 可选监听器列表。
	listeners?: ClashListener[];
}

/**
 * Clash 代理节点结构。
 *
 * 覆盖 SSR、Trojan 等转换流程中可能写入的常见节点字段。
 */
export interface ClashProxy {
	// 节点名称。
	name: string;
	// 节点协议类型。
	type: string;
	// 节点服务器地址。
	server: string;
	// 节点端口。
	port: number;
	// 节点密码。
	password?: string;
	// 加密方式。
	cipher?: string;
	// 是否启用 UDP。
	udp?: boolean;
	// 混淆方式。
	obfs?: string;
	// 混淆参数。
	'obfs-param'?: string;
	// 协议插件名称。
	protocol?: string;
	// 协议插件参数。
	'protocol-param'?: string;
	// TLS SNI。
	sni?: string;
	// 是否跳过证书校验。
	'skip-cert-verify'?: boolean;
}

/**
 * Clash 监听器结构。
 *
 * 描述多端口模式下按地区生成的本地监听入口。
 */
export interface ClashListener {
	// 监听器名称。
	name: string;
	// 监听器类型。
	type: string;
	// 本地监听端口。
	port: number;
	// 监听器绑定的代理或代理组名称。
	proxy: string;
}

/**
 * 代理地区信息。
 *
 * 描述地区代码、节点匹配规则和端口范围起点。
 */
export interface ProxyAreaInfo {
	// 地区代码。
	code: AreaCode;
	// 用于匹配节点名称的正则表达式。
	regex: string;
	// 端口相对起点，用于固定地区端口范围。
	startPort: number;
}

/**
 * 订阅流量原始信息。
 *
 * 描述订阅响应头中解析出的上传、下载、总量和过期时间。
 */
export interface SubInfo {
	// 已上传流量。
	upload: number;
	// 已下载流量。
	download: number;
	// 总流量额度。
	total: number;
	// 过期时间戳。
	expire: number;
}

/**
 * SSR 订阅节点结构。
 *
 * 描述从 SSR 订阅内容中解析出的单个原始节点。
 */
export interface SSRSubscriptionNode {
	// 节点服务器地址。
	server: string;
	// 节点端口。
	port: number;
	// SSR 协议名称。
	protocol: string;
	// 加密方式。
	method: string;
	// 混淆方式。
	obfs: string;
	// 节点密码。
	password: string;
	// 混淆参数。
	obfsParam?: string;
	// 协议参数。
	protocolParam?: string;
	// 节点备注名称。
	remarks?: string;
	// 节点分组名称。
	group?: string;
}

/**
 * SSR 订阅解析统计。
 *
 * 汇总订阅中的节点数量、地区分布、协议分布和加密方式分布。
 */
export interface SSRSubscriptionInfo {
	// 原始节点总数。
	totalNodes: number;
	// 成功解析的有效节点数。
	validNodes: number;
	// 按地区统计的节点数量。
	regions: Record<string, number>;
	// 按协议统计的节点数量。
	protocols: Record<string, number>;
	// 按加密方式统计的节点数量。
	ciphers: Record<string, number>;
}

/**
 * 订阅转换结果。
 *
 * 描述订阅内容转换为 Clash YAML 后的结果、节点数量和错误信息。
 */
export interface ConversionResult {
	// 转换是否成功。
	success: boolean;
	// 转换后的 Clash YAML 文本。
	clashYaml?: string;
	// 成功转换的节点数量。
	nodeCount?: number;
	// 转换失败时的错误消息。
	errorMessage?: string;
	// SSR 订阅解析统计。
	stats?: SSRSubscriptionInfo;
}
