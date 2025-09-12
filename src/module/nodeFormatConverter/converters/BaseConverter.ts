/**
 * 基础转换器抽象类
 * 定义所有格式转换器的通用接口和方法
 */

import { ConversionOptions, ConversionResult, ProxyNode } from '../models';

// 转换上下文接口
export interface ConversionContext {
	/** 源格式 */
	sourceFormat: string;
	/** 目标格式 */
	targetFormat: string;
	/** 转换选项 */
	options: ConversionOptions;
	/** 节点列表 */
	nodes: ProxyNode[];
	/** 额外数据 */
	metadata?: Record<string, any>;
}

/**
 * 抽象基础转换器类
 */
export abstract class BaseConverter<TInput = ProxyNode[], TOutput = string> {
	protected options: ConversionOptions;

	constructor(options: ConversionOptions = {}) {
		this.options = {
			includeDirectProxy: true,
			enableUDP: true,
			outputFormat: 'yaml',
			...options,
		};
	}

	/**
	 * 获取转换器支持的源格式
	 */
	abstract getSupportedSourceFormats(): string[];

	/**
	 * 获取转换器支持的目标格式
	 */
	abstract getSupportedTargetFormats(): string[];

	/**
	 * 检查是否支持指定的转换
	 */
	canConvert(sourceFormat: string, targetFormat: string): boolean {
		return this.getSupportedSourceFormats().includes(sourceFormat) && this.getSupportedTargetFormats().includes(targetFormat);
	}

	/**
	 * 执行转换
	 */
	abstract convert(input: TInput, context?: Partial<ConversionContext>): ConversionResult<TOutput>;

	/**
	 * 验证输入数据
	 */
	protected validateInput(input: TInput): void {
		if (!input) {
			throw new Error('输入数据不能为空');
		}
	}

	/**
	 * 创建转换上下文
	 */
	protected createContext(input: TInput, context?: Partial<ConversionContext>): ConversionContext {
		return {
			sourceFormat: 'nodes',
			targetFormat: 'clash',
			options: this.options,
			nodes: Array.isArray(input) ? input : [],
			metadata: {},
			...context,
		};
	}

	/**
	 * 处理转换错误
	 */
	protected handleError(error: unknown, input: TInput): ConversionResult<TOutput> {
		const message = error instanceof Error ? error.message : String(error);
		console.error('转换失败:', message);

		return {
			success: false,
			error: message,
			warnings: [],
		};
	}

	/**
	 * 创建成功结果
	 */
	protected createSuccessResult(data: TOutput, warnings: string[] = [], stats?: any): ConversionResult<TOutput> {
		return {
			success: true,
			data,
			warnings,
			stats,
		};
	}

	/**
	 * 更新转换器选项
	 */
	updateOptions(newOptions: Partial<ConversionOptions>): void {
		this.options = { ...this.options, ...newOptions };
	}

	/**
	 * 获取当前转换器选项
	 */
	getOptions(): ConversionOptions {
		return { ...this.options };
	}
}

/**
 * 转换器工厂注册表
 */
export class ConverterRegistry {
	private static converters = new Map<string, () => BaseConverter>();

	/**
	 * 注册转换器
	 */
	static register(sourceFormats: string[], targetFormats: string[], converterFactory: () => BaseConverter): void {
		for (const source of sourceFormats) {
			for (const target of targetFormats) {
				const key = `${source.toLowerCase()}->${target.toLowerCase()}`;
				this.converters.set(key, converterFactory);
			}
		}
	}

	/**
	 * 获取转换器
	 */
	static getConverter(sourceFormat: string, targetFormat: string): BaseConverter | null {
		const key = `${sourceFormat.toLowerCase()}->${targetFormat.toLowerCase()}`;
		const factory = this.converters.get(key);
		return factory ? factory() : null;
	}

	/**
	 * 检查是否支持指定转换
	 */
	static canConvert(sourceFormat: string, targetFormat: string): boolean {
		const key = `${sourceFormat.toLowerCase()}->${targetFormat.toLowerCase()}`;
		return this.converters.has(key);
	}

	/**
	 * 获取所有支持的转换
	 */
	static getSupportedConversions(): Array<{ source: string; target: string }> {
		return Array.from(this.converters.keys()).map((key) => {
			const [source, target] = key.split('->');
			return { source, target };
		});
	}

	/**
	 * 清空注册表
	 */
	static clear(): void {
		this.converters.clear();
	}
}

/**
 * 通用转换工具类
 */
export class ConversionUtils {
	/**
	 * 过滤节点
	 */
	static filterNodes(nodes: ProxyNode[], options: ConversionOptions): ProxyNode[] {
		let filtered = [...nodes];

		// 协议过滤
		if (options.filter?.protocols && options.filter.protocols.length > 0) {
			filtered = filtered.filter((node) => options.filter!.protocols!.includes(node.type));
		}

		// 包含关键词过滤
		if (options.filter?.include && options.filter.include.length > 0) {
			filtered = filtered.filter((node) =>
				options.filter!.include!.some((keyword) => node.name.toLowerCase().includes(keyword.toLowerCase()))
			);
		}

		// 排除关键词过滤
		if (options.filter?.exclude && options.filter.exclude.length > 0) {
			filtered = filtered.filter(
				(node) => !options.filter!.exclude!.some((keyword) => node.name.toLowerCase().includes(keyword.toLowerCase()))
			);
		}

		return filtered;
	}

	/**
	 * 去重节点（基于服务器地址和端口）
	 */
	static deduplicateNodes(nodes: ProxyNode[]): ProxyNode[] {
		const seen = new Set<string>();
		return nodes.filter((node) => {
			const key = `${node.server}:${node.port}:${node.type}`;
			if (seen.has(key)) {
				return false;
			}
			seen.add(key);
			return true;
		});
	}

	/**
	 * 排序节点
	 */
	static sortNodes(nodes: ProxyNode[], sortBy: 'name' | 'region' | 'type' = 'name'): ProxyNode[] {
		return [...nodes].sort((a, b) => {
			switch (sortBy) {
				case 'name':
					return a.name.localeCompare(b.name, 'zh-CN', { numeric: true });
				case 'type':
					return a.type.localeCompare(b.type);
				case 'region':
					// 需要导入地区检测器
					// const regionA = RegionDetector.getRegionLabel(a.name);
					// const regionB = RegionDetector.getRegionLabel(b.name);
					// return regionA.localeCompare(regionB, 'zh-CN');
					return a.name.localeCompare(b.name, 'zh-CN', { numeric: true });
				default:
					return 0;
			}
		});
	}

	/**
	 * 生成节点统计信息
	 */
	static generateStats(nodes: ProxyNode[]): {
		totalNodes: number;
		byType: Record<string, number>;
		byRegion: Record<string, number>;
	} {
		const stats = {
			totalNodes: nodes.length,
			byType: {} as Record<string, number>,
			byRegion: {} as Record<string, number>,
		};

		for (const node of nodes) {
			// 统计协议类型
			stats.byType[node.type] = (stats.byType[node.type] || 0) + 1;

			// 统计地区（简单实现，基于节点名称）
			let region = '其他';
			const name = node.name.toLowerCase();

			if (name.includes('香港') || name.includes('hk')) region = '香港';
			else if (name.includes('台湾') || name.includes('tw')) region = '台湾';
			else if (name.includes('日本') || name.includes('jp')) region = '日本';
			else if (name.includes('韩国') || name.includes('kr')) region = '韩国';
			else if (name.includes('新加坡') || name.includes('sg')) region = '新加坡';
			else if (name.includes('美国') || name.includes('us')) region = '美国';

			stats.byRegion[region] = (stats.byRegion[region] || 0) + 1;
		}

		return stats;
	}

	/**
	 * 验证节点配置
	 */
	static validateNodes(nodes: ProxyNode[]): { valid: ProxyNode[]; invalid: Array<{ node: ProxyNode; error: string }> } {
		const valid: ProxyNode[] = [];
		const invalid: Array<{ node: ProxyNode; error: string }> = [];

		for (const node of nodes) {
			try {
				// 基础验证
				if (!node.name || !node.server || !node.port || !node.type) {
					throw new Error('节点信息不完整');
				}

				if (node.port <= 0 || node.port > 65535) {
					throw new Error('端口号无效');
				}

				// 服务器地址格式验证
				if (!/^[a-zA-Z0-9.-]+$/.test(node.server)) {
					throw new Error('服务器地址格式无效');
				}

				valid.push(node);
			} catch (error) {
				invalid.push({
					node,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		return { valid, invalid };
	}
}
