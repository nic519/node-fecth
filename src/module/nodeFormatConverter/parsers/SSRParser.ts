/**
 * ShadowsocksR (SSR) 协议解析器
 * 专门用于解析 SSR 协议的节点链接
 */

import { ProxyNodeFactory, ShadowsocksRNode } from '../models';
import { BaseParser, ParseResult } from './BaseParser';

/**
 * SSR 解析器类
 */
export class SSRParser extends BaseParser<ShadowsocksRNode> {
	/**
	 * 获取支持的协议前缀
	 */
	getSupportedProtocols(): string[] {
		return ['ssr://'];
	}

	/**
	 * 解析单个 SSR 节点URL
	 */
	parseNode(url: string): ParseResult<ShadowsocksRNode> {
		try {
			if (!url.startsWith('ssr://')) {
				return {
					success: false,
					error: '无效的 SSR 链接格式，必须以 ssr:// 开头',
					originalUrl: url,
				};
			}

			// 移除 ssr:// 前缀并解码
			const encodedContent = url.substring(6);
			const decodedContent = this.decodeBase64UrlSafe(encodedContent);

			const node = this.parseSSRContent(decodedContent);

			return {
				success: true,
				node,
				originalUrl: url,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				originalUrl: url,
			};
		}
	}

	/**
	 * 生成 SSR 节点URL
	 */
	generateNodeUrl(node: ShadowsocksRNode): string {
		// 编码密码
		const passwordBase64 = this.encodeBase64UrlSafe(node.password);

		// 构建基础 URL
		const baseUrl = `${node.server}:${node.port}:${node.protocol}:${node.cipher}:${node.obfs}:${passwordBase64}`;

		// 构建查询参数
		const params: Array<string> = [];

		if (node.obfsParam) {
			params.push(`obfsparam=${this.encodeBase64UrlSafe(node.obfsParam)}`);
		}

		if (node.protocolParam) {
			params.push(`protoparam=${this.encodeBase64UrlSafe(node.protocolParam)}`);
		}

		if (node.remarks || node.name) {
			const remarks = node.remarks || node.name;
			params.push(`remarks=${this.encodeBase64UrlSafe(remarks)}`);
		}

		if (node.group) {
			params.push(`group=${this.encodeBase64UrlSafe(node.group)}`);
		}

		// 组合完整 URL
		const fullUrl = params.length > 0 ? `${baseUrl}/?${params.join('&')}` : baseUrl;

		// 对整个 URL 进行 base64 编码
		const encodedUrl = this.encodeBase64UrlSafe(fullUrl);

		return `ssr://${encodedUrl}`;
	}

	/**
	 * 解析 SSR 内容字符串
	 */
	private parseSSRContent(content: string): ShadowsocksRNode {
		// SSR 格式: server:port:protocol:method:obfs:password_base64/?params
		const [baseInfo, queryString] = content.split('/?');
		const parts = baseInfo.split(':');

		if (parts.length !== 6) {
			throw new Error(`无效的 SSR 格式，期望 6 个部分，实际得到 ${parts.length} 个`);
		}

		const [server, portStr, protocol, method, obfs, passwordBase64] = parts;

		// 验证基本信息
		if (!server || !portStr || !protocol || !method || !obfs) {
			throw new Error('SSR 基本信息不完整');
		}

		const port = parseInt(portStr);
		if (isNaN(port) || port <= 0 || port > 65535) {
			throw new Error(`无效的端口号: ${portStr}`);
		}

		// 解码密码
		const password = passwordBase64 ? this.decodeBase64UrlSafe(passwordBase64) : '';

		// 解析查询参数
		const params = this.parseSSRQueryParams(queryString || '');

		// 生成节点名称
		const name = params.remarks || this.generateSafeName('', server, port);

		// 创建节点
		const node = ProxyNodeFactory.createShadowsocksR({
			name,
			server,
			port,
			cipher: method,
			password,
			protocol,
			obfs,
			protocolParam: params.protoparam,
			obfsParam: params.obfsparam,
			udp: true, // SSR 默认启用 UDP
			remarks: params.remarks,
			group: params.group,
		});

		return node;
	}

	/**
	 * 解析 SSR 查询参数
	 */
	private parseSSRQueryParams(queryString: string): Record<string, string> {
		const params: Record<string, string> = {};

		if (!queryString) {
			return params;
		}

		const pairs = queryString.split('&');
		for (const pair of pairs) {
			const [key, value] = pair.split('=');
			if (key && value) {
				try {
					// 尝试解码 base64 值
					params[key] = this.decodeBase64UrlSafe(value);
				} catch {
					// 如果解码失败，尝试 URL 解码
					try {
						params[key] = decodeURIComponent(value);
					} catch {
						// 如果都失败，使用原始值
						params[key] = value;
					}
				}
			}
		}

		return params;
	}

	/**
	 * URL 安全的 base64 解码
	 */
	private decodeBase64UrlSafe(encoded: string): string {
		// 将 URL 安全的 base64 转换为标准 base64
		let standardBase64 = encoded.replace(/-/g, '+').replace(/_/g, '/');

		// 添加必要的填充
		const paddingLength = (4 - (standardBase64.length % 4)) % 4;
		standardBase64 += '='.repeat(paddingLength);

		try {
			return atob(standardBase64);
		} catch (error) {
			throw new Error(`Base64 解码失败: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * 验证 SSR 节点特定配置
	 */
	protected validateNode(node: Partial<ShadowsocksRNode>): void {
		super.validateNode(node);

		if (!node.cipher) {
			throw new Error('SSR 节点必须指定加密方式');
		}

		if (!node.password) {
			throw new Error('SSR 节点必须指定密码');
		}

		if (!node.protocol) {
			throw new Error('SSR 节点必须指定协议');
		}

		if (!node.obfs) {
			throw new Error('SSR 节点必须指定混淆方式');
		}
	}

	/**
	 * 获取支持的加密方式列表
	 */
	static getSupportedCiphers(): string[] {
		return [
			'aes-128-ctr',
			'aes-192-ctr',
			'aes-256-ctr',
			'aes-128-cfb',
			'aes-192-cfb',
			'aes-256-cfb',
			'aes-128-ofb',
			'aes-192-ofb',
			'aes-256-ofb',
			'camellia-128-cfb',
			'camellia-192-cfb',
			'camellia-256-cfb',
			'bf-cfb',
			'cast5-cfb',
			'des-cfb',
			'idea-cfb',
			'rc2-cfb',
			'rc4',
			'rc4-md5',
			'seed-cfb',
			'chacha20',
			'chacha20-ietf',
			'salsa20',
			'chacha20-ietf-poly1305',
		];
	}

	/**
	 * 获取支持的协议列表
	 */
	static getSupportedProtocols(): string[] {
		return [
			'origin',
			'verify_deflate',
			'verify_sha1',
			'auth_sha1',
			'auth_sha1_v2',
			'auth_sha1_v4',
			'auth_aes128_md5',
			'auth_aes128_sha1',
			'auth_chain_a',
			'auth_chain_b',
			'auth_chain_c',
			'auth_chain_d',
			'auth_chain_e',
			'auth_chain_f',
		];
	}

	/**
	 * 获取支持的混淆方式列表
	 */
	static getSupportedObfs(): string[] {
		return ['plain', 'http_simple', 'http_post', 'random_head', 'tls1.2_ticket_auth', 'tls1.2_ticket_fastauth'];
	}

	/**
	 * 验证加密方式是否支持
	 */
	static isCipherSupported(cipher: string): boolean {
		return this.getSupportedCiphers().includes(cipher);
	}

	/**
	 * 验证协议是否支持
	 */
	static isProtocolSupported(protocol: string): boolean {
		return this.getSupportedProtocols().includes(protocol);
	}

	/**
	 * 验证混淆方式是否支持
	 */
	static isObfsSupported(obfs: string): boolean {
		return this.getSupportedObfs().includes(obfs);
	}
}
