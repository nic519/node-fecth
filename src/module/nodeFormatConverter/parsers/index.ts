/**
 * 解析器模块导出文件
 */

// 基础解析器
export * from './BaseParser';

// 具体协议解析器
export * from './SSRParser';

// 导入其他协议解析器（当它们被创建时）
// export * from './ShadowsocksParser';
// export * from './VmessParser';
// export * from './TrojanParser';

// 解析器工厂
import { ParserRegistry } from './BaseParser';
import { SSRParser } from './SSRParser';

/**
 * 初始化所有解析器
 */
export function initializeParsers(): void {
	// 清空现有注册
	ParserRegistry.clear();

	// 注册 SSR 解析器
	ParserRegistry.register(['ssr://'], () => new SSRParser());

	// TODO: 注册其他协议解析器
	// ParserRegistry.register(['ss://'], () => new ShadowsocksParser());
	// ParserRegistry.register(['vmess://'], () => new VmessParser());
	// ParserRegistry.register(['trojan://'], () => new TrojanParser());
}

/**
 * 统一解析器工厂类
 */
export class UniversalParser {
	private static initialized = false;

	/**
	 * 确保解析器已初始化
	 */
	private static ensureInitialized(): void {
		if (!this.initialized) {
			initializeParsers();
			this.initialized = true;
		}
	}

	/**
	 * 解析单个节点URL
	 */
	static parseNode(url: string) {
		this.ensureInitialized();

		const parser = ParserRegistry.getParserForUrl(url);
		if (!parser) {
			throw new Error(`不支持的协议: ${url.split('://')[0] || 'unknown'}`);
		}

		return parser.parseNode(url);
	}

	/**
	 * 解析多个节点URL
	 */
	static parseMultiple(urls: string[] | string) {
		this.ensureInitialized();

		const urlList = Array.isArray(urls) ? urls : urls.split('\n');
		const allResults = {
			nodes: [] as any[],
			failures: [] as any[],
			stats: {
				total: 0,
				success: 0,
				failed: 0,
			},
		};

		// 按协议分组URL
		const urlsByProtocol = new Map<string, string[]>();

		for (const url of urlList) {
			const trimmedUrl = url.trim();
			if (!trimmedUrl || trimmedUrl.startsWith('#')) continue;

			const protocol = trimmedUrl.split('://')[0]?.toLowerCase() + '://';
			if (!urlsByProtocol.has(protocol)) {
				urlsByProtocol.set(protocol, []);
			}
			urlsByProtocol.get(protocol)!.push(trimmedUrl);
		}

		// 使用对应解析器解析每种协议
		for (const [protocol, protocolUrls] of urlsByProtocol) {
			const parser = ParserRegistry.getParser(protocol);
			if (!parser) {
				// 记录不支持的协议
				for (const url of protocolUrls) {
					allResults.failures.push({
						url: url.substring(0, 50) + '...',
						error: `不支持的协议: ${protocol}`,
					});
				}
				continue;
			}

			const result = parser.parseMultiple(protocolUrls);
			allResults.nodes.push(...result.nodes);
			allResults.failures.push(...result.failures);
		}

		// 更新统计信息
		allResults.stats = {
			total: urlList.filter((url) => url.trim() && !url.trim().startsWith('#')).length,
			success: allResults.nodes.length,
			failed: allResults.failures.length,
		};

		return allResults;
	}

	/**
	 * 解析base64订阅内容
	 */
	static parseBase64Subscription(base64Content: string) {
		try {
			// 解码base64内容
			const decodedContent = atob(base64Content);
			return this.parseMultiple(decodedContent);
		} catch (error) {
			throw new Error(`订阅内容解析失败: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * 获取支持的协议列表
	 */
	static getSupportedProtocols(): string[] {
		this.ensureInitialized();
		return ParserRegistry.getSupportedProtocols();
	}

	/**
	 * 检查是否支持指定协议
	 */
	static isProtocolSupported(protocol: string): boolean {
		this.ensureInitialized();
		return ParserRegistry.getSupportedProtocols().includes(protocol.toLowerCase());
	}

	/**
	 * 重新初始化解析器
	 */
	static reinitialize(): void {
		this.initialized = false;
		this.ensureInitialized();
	}
}
