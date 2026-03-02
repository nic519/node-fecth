import { ProxyConfig } from '../config/global-config';


export class CommonUtils {

	/**
	 * 清理 URL 中的空格和包裹符号
	 * 并根据配置自动处理代理逻辑
	 * @param url 原始 URL
	 * @returns 处理后的 URL
	 */
	static normalizeUrl(url: string): string {
		if (!url) return '';
		// 1. 去除首尾空格
		let cleanUrl = url.trim();
		// 2. 去除首尾的反引号
		cleanUrl = cleanUrl.replace(/^[`'"]+|[`'"]+$/g, '');
		// 3. 再次去除可能的空格
		return cleanUrl.trim();
	}

	static tryProxyUrl(cleanUrl: string, forceProxy: boolean = false): string {
		// 检查是否需要走代理
		try {
			let needProxy = forceProxy;

			if (!needProxy) {
				const urlObj = new URL(cleanUrl);
				// 检查域名是否在目标列表中
				needProxy = ProxyConfig.targetDomains.some(domain =>
					urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
				);
			}

			if (needProxy) {
				// 构建代理 URL: https://proxy-api?url=target-url
				const proxyUrl = new URL(ProxyConfig.proxyApiUrl);
				proxyUrl.searchParams.set('url', cleanUrl);
				return proxyUrl.toString();
			}
		} catch (e) {
			// URL 解析失败，忽略代理逻辑，直接返回原始清理后的 URL
			console.warn('Invalid URL for proxy check:', cleanUrl);
		}
		return cleanUrl;
	}
}
