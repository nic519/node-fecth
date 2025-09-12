/**
 * 代理转换器工厂
 * 提供统一的入口点来处理各种代理协议的解析和转换
 */

import { CustomError, ErrorCode } from '@/utils/customError';
import { UniversalConverter, initializeConverters } from './converters';
import { ConversionOptions, ConversionResult, ProxyNode, SubscriptionInfo } from './models';
import { UniversalParser, initializeParsers } from './parsers';

// 工厂选项接口
export interface FactoryOptions {
	/** 解析器选项 */
	parser?: {
		strictMode?: boolean;
		skipInvalidNodes?: boolean;
		maxNodes?: number;
		timeout?: number;
	};
	/** 转换器选项 */
	converter?: ConversionOptions;
	/** 是否自动初始化 */
	autoInitialize?: boolean;
}

/**
 * 代理转换器工厂类
 * 提供从解析到转换的完整流程
 */
export class ProxyConverterFactory {
	private static instance: ProxyConverterFactory;
	private initialized = false;
	private options: FactoryOptions;

	private constructor(options: FactoryOptions = {}) {
		this.options = {
			autoInitialize: true,
			parser: {
				strictMode: false,
				skipInvalidNodes: true,
				maxNodes: 1000,
				timeout: 5000,
			},
			converter: {
				includeDirectProxy: true,
				enableUDP: true,
				outputFormat: 'yaml',
			},
			...options,
		};

		if (this.options.autoInitialize) {
			this.initialize();
		}
	}

	/**
	 * 获取工厂实例（单例模式）
	 */
	static getInstance(options?: FactoryOptions): ProxyConverterFactory {
		if (!this.instance) {
			this.instance = new ProxyConverterFactory(options);
		}
		return this.instance;
	}

	/**
	 * 创建新的工厂实例
	 */
	static create(options?: FactoryOptions): ProxyConverterFactory {
		return new ProxyConverterFactory(options);
	}

	/**
	 * 初始化解析器和转换器
	 */
	initialize(): void {
		if (this.initialized) return;

		try {
			initializeParsers();
			initializeConverters();
			this.initialized = true;
			console.log('✅ 代理转换器工厂初始化完成');
		} catch (error) {
			console.error('❌ 代理转换器工厂初始化失败:', error);
			throw new CustomError(ErrorCode.CONVERSION_FAILED, '工厂初始化失败', 500, {
				originalError: error instanceof Error ? error.message : String(error),
			});
		}
	}

	/**
	 * 从base64订阅内容转换为Clash配置
	 */
	async convertBase64ToClash(base64Content: string, options?: Partial<ConversionOptions>): Promise<ConversionResult<string>> {
		try {
			this.ensureInitialized();

			// 合并转换选项
			const convertOptions = { ...this.options.converter, ...options };

			// 解析订阅内容
			const parseResult = UniversalParser.parseBase64Subscription(base64Content);

			if (parseResult.nodes.length === 0) {
				return {
					success: false,
					error: '订阅内容中没有找到有效的代理节点',
					warnings: parseResult.failures.map((f) => f.error),
				};
			}

			// 转换为Clash格式
			const conversionResult = UniversalConverter.convert(parseResult.nodes, 'nodes', 'clash', convertOptions);

			// 生成统计信息
			const stats = this.generateSubscriptionInfo(parseResult.nodes, parseResult.failures);

			return {
				...conversionResult,
				stats,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * 从代理链接列表转换为Clash配置
	 */
	async convertLinksToClash(links: string[] | string, options?: Partial<ConversionOptions>): Promise<ConversionResult<string>> {
		try {
			this.ensureInitialized();

			// 合并转换选项
			const convertOptions = { ...this.options.converter, ...options };

			// 解析代理链接
			const parseResult = UniversalParser.parseMultiple(links);

			if (parseResult.nodes.length === 0) {
				return {
					success: false,
					error: '没有找到有效的代理节点',
					warnings: parseResult.failures.map((f) => f.error),
				};
			}

			// 转换为Clash格式
			const conversionResult = UniversalConverter.convert(parseResult.nodes, 'nodes', 'clash', convertOptions);

			// 生成统计信息
			const stats = this.generateSubscriptionInfo(parseResult.nodes, parseResult.failures);

			return {
				...conversionResult,
				stats,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * 解析单个代理链接
	 */
	async parseProxyLink(link: string): Promise<ConversionResult<ProxyNode>> {
		try {
			this.ensureInitialized();

			const result = UniversalParser.parseNode(link);

			if (!result.success || !result.node) {
				return {
					success: false,
					error: result.error || '解析失败',
				};
			}

			return {
				success: true,
				data: result.node,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * 验证订阅内容
	 */
	async validateSubscription(base64Content: string): Promise<{
		isValid: boolean;
		nodeCount: number;
		supportedNodes: number;
		unsupportedNodes: number;
		errors: string[];
	}> {
		try {
			this.ensureInitialized();

			const parseResult = UniversalParser.parseBase64Subscription(base64Content);

			return {
				isValid: parseResult.nodes.length > 0,
				nodeCount: parseResult.stats.total,
				supportedNodes: parseResult.stats.success,
				unsupportedNodes: parseResult.stats.failed,
				errors: parseResult.failures.map((f) => f.error),
			};
		} catch (error) {
			return {
				isValid: false,
				nodeCount: 0,
				supportedNodes: 0,
				unsupportedNodes: 0,
				errors: [error instanceof Error ? error.message : String(error)],
			};
		}
	}

	/**
	 * 获取支持的协议列表
	 */
	getSupportedProtocols(): string[] {
		this.ensureInitialized();
		return UniversalParser.getSupportedProtocols();
	}

	/**
	 * 获取支持的转换格式
	 */
	getSupportedFormats(): Array<{ source: string; target: string }> {
		this.ensureInitialized();
		return UniversalConverter.getSupportedConversions();
	}

	/**
	 * 更新工厂选项
	 */
	updateOptions(newOptions: Partial<FactoryOptions>): void {
		this.options = {
			...this.options,
			...newOptions,
			parser: { ...this.options.parser, ...newOptions.parser },
			converter: { ...this.options.converter, ...newOptions.converter },
		};
	}

	/**
	 * 获取当前选项
	 */
	getOptions(): FactoryOptions {
		return { ...this.options };
	}

	/**
	 * 重新初始化工厂
	 */
	reinitialize(): void {
		this.initialized = false;
		this.initialize();
	}

	/**
	 * 确保工厂已初始化
	 */
	private ensureInitialized(): void {
		if (!this.initialized) {
			this.initialize();
		}
	}

	/**
	 * 生成订阅信息
	 */
	private generateSubscriptionInfo(nodes: ProxyNode[], failures: Array<{ url: string; error: string }>): SubscriptionInfo {
		const regions: Record<string, number> = {};
		const protocols: Record<string, number> = {};

		// 统计地区和协议分布
		for (const node of nodes) {
			// 统计协议
			protocols[node.type] = (protocols[node.type] || 0) + 1;

			// 简单的地区检测
			let region = '其他';
			const name = node.name.toLowerCase();

			if (name.includes('香港') || name.includes('hk')) region = '香港';
			else if (name.includes('台湾') || name.includes('tw')) region = '台湾';
			else if (name.includes('日本') || name.includes('jp')) region = '日本';
			else if (name.includes('韩国') || name.includes('kr')) region = '韩国';
			else if (name.includes('新加坡') || name.includes('sg')) region = '新加坡';
			else if (name.includes('美国') || name.includes('us')) region = '美国';

			regions[region] = (regions[region] || 0) + 1;
		}

		return {
			totalNodes: nodes.length + failures.length,
			validNodes: nodes.length,
			regions,
			protocols,
			lastUpdate: new Date(),
		};
	}
}

// 导出便捷函数
export const proxyConverter = ProxyConverterFactory.getInstance();

/**
 * 快速转换base64订阅为Clash配置
 */
export async function convertBase64ToClash(base64Content: string, options?: Partial<ConversionOptions>): Promise<ConversionResult<string>> {
	return proxyConverter.convertBase64ToClash(base64Content, options);
}

/**
 * 快速转换代理链接为Clash配置
 */
export async function convertLinksToClash(
	links: string[] | string,
	options?: Partial<ConversionOptions>
): Promise<ConversionResult<string>> {
	return proxyConverter.convertLinksToClash(links, options);
}

/**
 * 快速解析单个代理链接
 */
export async function parseProxyLink(link: string): Promise<ConversionResult<ProxyNode>> {
	return proxyConverter.parseProxyLink(link);
}

/**
 * 快速验证订阅内容
 */
export async function validateSubscription(base64Content: string) {
	return proxyConverter.validateSubscription(base64Content);
}

/**
 * 获取支持的协议列表
 */
export function getSupportedProtocols(): string[] {
	return proxyConverter.getSupportedProtocols();
}
