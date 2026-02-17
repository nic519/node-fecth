import { logger, REQUEST_TIMEOUT } from '@/utils/request/network.config';

// ==================== 日志记录器 ====================

export class NetworkUtils {
	/**
	 * 从远程URL获取原始内容（静态方法，用于获取规则等）
	 * @param url 远程URL
	 * @returns 内容文本
	 */
	static async fetchRawContent(url: string, retries = 3): Promise<string> {
		let lastError: unknown;
		for (let i = 0; i < retries; i++) {
			try {
				logger.info({ url, attempt: i + 1 }, '获取远程原始内容');

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
			} catch (error) {
				lastError = error;
				logger.warn({ url, error, attempt: i + 1 }, 'Fetch attempt failed, retrying...');
				if (i < retries - 1) {
					await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
				}
			}
		}
		throw lastError;
	}
}
