/**
 * Clash 格式转换器
 * 将代理节点转换为 Clash 配置格式
 */

import { stringify as yamlStringify } from 'yaml';
import { ClashConfig, ClashConfigBuilder, ClashProxy, ConversionOptions, ConversionResult, ProxyNode, ShadowsocksRNode } from '../models';
import { BaseConverter, ConversionContext, ConversionUtils } from './BaseConverter';

/**
 * Clash 配置转换器
 */
export class ClashConverter extends BaseConverter<ProxyNode[], string> {
	/**
	 * 获取支持的源格式
	 */
	getSupportedSourceFormats(): string[] {
		return ['nodes', 'proxy-nodes'];
	}

	/**
	 * 获取支持的目标格式
	 */
	getSupportedTargetFormats(): string[] {
		return ['clash', 'clash-yaml', 'clash-json'];
	}

	/**
	 * 执行转换
	 */
	convert(nodes: ProxyNode[], context?: Partial<ConversionContext>): ConversionResult<string> {
		try {
			this.validateInput(nodes);

			const ctx = this.createContext(nodes, context);
			const warnings: string[] = [];

			// 过滤和处理节点
			let processedNodes = ConversionUtils.filterNodes(nodes, ctx.options);

			// 去重
			const originalCount = processedNodes.length;
			processedNodes = ConversionUtils.deduplicateNodes(processedNodes);
			if (processedNodes.length < originalCount) {
				warnings.push(`去重后节点数量从 ${originalCount} 减少到 ${processedNodes.length}`);
			}

			// 验证节点
			const { valid: validNodes, invalid: invalidNodes } = ConversionUtils.validateNodes(processedNodes);
			if (invalidNodes.length > 0) {
				warnings.push(`跳过 ${invalidNodes.length} 个无效节点`);
				invalidNodes.forEach(({ node, error }) => {
					console.warn(`无效节点 [${node.name}]: ${error}`);
				});
			}

			if (validNodes.length === 0) {
				return {
					success: false,
					error: '没有找到有效的代理节点',
					warnings,
				};
			}

			// 排序节点
			const sortedNodes = ConversionUtils.sortNodes(validNodes, 'name');

			// 构建 Clash 配置
			const clashConfig = this.buildClashConfig(sortedNodes, ctx.options);

			// 生成输出
			const output = this.generateOutput(clashConfig, ctx.options.outputFormat || 'yaml');

			// 生成统计信息
			const stats = ConversionUtils.generateStats(sortedNodes);

			return this.createSuccessResult(output, warnings, {
				totalNodes: stats.totalNodes,
				validNodes: stats.totalNodes,
				regions: stats.byRegion,
				protocols: stats.byType,
			});
		} catch (error) {
			return this.handleError(error, nodes);
		}
	}

	/**
	 * 构建 Clash 配置
	 */
	private buildClashConfig(nodes: ProxyNode[], options: ConversionOptions): ClashConfig {
		const builder = new ClashConfigBuilder();

		// 转换代理节点
		const proxies = this.convertNodesToClashProxies(nodes, options);
		builder.setProxies(proxies);

		return builder.build();
	}

	/**
	 * 转换节点为 Clash 代理配置
	 */
	private convertNodesToClashProxies(nodes: ProxyNode[], options: ConversionOptions): ClashProxy[] {
		const proxies: ClashProxy[] = [];

		// 添加直连代理
		if (options.includeDirectProxy) {
			proxies.push({
				name: '🇨🇳 直连',
				type: 'direct',
			});
		}

		// 转换节点
		for (const node of nodes) {
			try {
				const clashProxy = this.convertNodeToClashProxy(node, options);
				proxies.push(clashProxy);
			} catch (error) {
				console.warn(`转换节点失败 [${node.name}]: ${error instanceof Error ? error.message : String(error)}`);
			}
		}

		return proxies;
	}

	/**
	 * 转换单个节点为 Clash 代理配置
	 */
	private convertNodeToClashProxy(node: ProxyNode, options: ConversionOptions): ClashProxy {
		const baseProxy: ClashProxy = {
			name: node.name,
			type: this.mapNodeTypeToClash(node.type),
			server: node.server,
			port: node.port,
		};

		// 根据节点类型设置特定配置
		switch (node.type) {
			case 'ssr':
				return this.convertSSRNode(node as ShadowsocksRNode, baseProxy, options);
			// case 'ss':
			//   return this.convertSSNode(node as ShadowsocksNode, baseProxy, options);
			// case 'vmess':
			//   return this.convertVmessNode(node as VmessNode, baseProxy, options);
			// case 'trojan':
			//   return this.convertTrojanNode(node as TrojanNode, baseProxy, options);
			default:
				throw new Error(`不支持的节点类型: ${node.type}`);
		}
	}

	/**
	 * 转换 SSR 节点
	 */
	private convertSSRNode(node: ShadowsocksRNode, baseProxy: ClashProxy, options: ConversionOptions): ClashProxy {
		const ssrProxy: ClashProxy = {
			...baseProxy,
			type: 'ssr',
			cipher: node.cipher,
			password: node.password,
			protocol: node.protocol,
			obfs: node.obfs,
		};

		// 添加协议参数
		if (node.protocolParam) {
			ssrProxy['protocol-param'] = node.protocolParam;
		}

		// 添加混淆参数
		if (node.obfsParam) {
			ssrProxy['obfs-param'] = node.obfsParam;
		}

		// 启用 UDP
		if (options.enableUDP && node.udp) {
			ssrProxy.udp = true;
		}

		return ssrProxy;
	}

	/**
	 * 映射节点类型到 Clash 类型
	 */
	private mapNodeTypeToClash(nodeType: string): string {
		const typeMap: Record<string, string> = {
			ss: 'ss',
			ssr: 'ssr',
			vmess: 'vmess',
			vless: 'vless',
			trojan: 'trojan',
			hysteria: 'hysteria',
			hysteria2: 'hysteria2',
		};

		return typeMap[nodeType] || nodeType;
	}

	/**
	 * 生成输出
	 */
	private generateOutput(config: ClashConfig, format: string): string {
		switch (format.toLowerCase()) {
			case 'json':
			case 'clash-json':
				return JSON.stringify(config, null, 2);

			case 'yaml':
			case 'clash-yaml':
			case 'clash':
			default:
				return yamlStringify(config, {
					lineWidth: 0,
					indent: 2,
				});
		}
	}

	/**
	 * 验证 Clash 配置
	 */
	static validateClashConfig(config: ClashConfig): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		// 验证代理节点
		if (!config.proxies || !Array.isArray(config.proxies)) {
			errors.push('缺少代理节点配置');
		} else if (config.proxies.length === 0) {
			errors.push('代理节点列表为空');
		} else {
			for (let i = 0; i < config.proxies.length; i++) {
				const proxy = config.proxies[i];
				if (!proxy.name) {
					errors.push(`代理节点 ${i} 缺少名称`);
				}
				if (!proxy.type) {
					errors.push(`代理节点 ${i} 缺少类型`);
				}
				if (proxy.type !== 'direct' && (!proxy.server || !proxy.port)) {
					errors.push(`代理节点 ${i} 缺少服务器信息`);
				}
			}
		}

		// 验证代理组
		if (config['proxy-groups']) {
			for (let i = 0; i < config['proxy-groups'].length; i++) {
				const group = config['proxy-groups'][i];
				if (!group.name) {
					errors.push(`代理组 ${i} 缺少名称`);
				}
				if (!group.type) {
					errors.push(`代理组 ${i} 缺少类型`);
				}
				if (!group.proxies || group.proxies.length === 0) {
					errors.push(`代理组 ${i} 没有代理节点`);
				}
			}
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}
}

/**
 * Clash 配置优化器
 */
export class ClashConfigOptimizer {
	/**
	 * 优化配置文件大小
	 */
	static optimizeSize(config: ClashConfig): ClashConfig {
		const optimized: ClashConfig = { ...config };

		// 移除重复的代理节点
		if (optimized.proxies) {
			const seen = new Set<string>();
			optimized.proxies = optimized.proxies.filter((proxy) => {
				// 直连代理不需要去重
				if (proxy.type === 'direct') {
					return true;
				}
				const key = `${proxy.type}-${proxy.server}-${proxy.port}`;
				if (seen.has(key)) {
					return false;
				}
				seen.add(key);
				return true;
			});
		}

		// 压缩代理组
		if (optimized['proxy-groups']) {
			optimized['proxy-groups'] = optimized['proxy-groups'].filter((group) => group.proxies && group.proxies.length > 0);
		}

		return optimized;
	}

	/**
	 * 优化性能设置
	 */
	static optimizePerformance(config: ClashConfig): ClashConfig {
		const optimized: ClashConfig = { ...config };

		// 设置性能优化选项
		optimized['interface-name'] = '';
		optimized['routing-mark'] = 6666;

		// 优化 DNS 设置
		if (optimized.dns) {
			optimized.dns.enable = true;
			optimized.dns['enhanced-mode'] = 'fake-ip';
			optimized.dns['use-hosts'] = true;
		}

		// 添加实验性功能
		optimized.experimental = {
			'ignore-resolve-fail': true,
			'sniff-tls-sni': true,
			...optimized.experimental,
		};

		return optimized;
	}
}
