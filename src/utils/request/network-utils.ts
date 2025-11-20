import { logger, REQUEST_TIMEOUT } from './network.config';

// ==================== 日志记录器 ====================

export class NetworkUtils {
	/**
	 * 从远程URL获取原始内容（静态方法，用于获取规则等）
	 * @param url 远程URL
	 * @returns 内容文本
	 */
	static async fetchRawContent(url: string): Promise<string> {
		logger.info({ url }, '获取远程原始内容');

		const response = await fetch(url, {
			headers: {
				'User-Agent': 'clash.meta',
				Accept: 'text/plain, text/yaml, application/x-yaml, */*',
				'Accept-Encoding': 'gzip, deflate, br',
				Connection: 'keep-alive',
			},
			signal: AbortSignal.timeout(REQUEST_TIMEOUT),
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => '无法读取错误响应');
			throw new Error(`获取失败 [${response.status}]: ${errorText}`);
		}

		const content = await response.text();
		return content;
	}
}
