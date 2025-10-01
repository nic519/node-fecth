import { GlobalConfig } from '@/config/global-config';
// import { time } from "console"; // 移除未使用的导入

const KvKey = (url: string) => `clash-sub:${url}`;

// 缓存有效期 5分钟
const cacheAvailableTime = 5 * 60 * 1000;

interface ClashContent {
	subInfo: string;
	content: string;
	fetchTime: Date;
}

export class TrafficUtils {
	constructor(private clashSubUrl: string) {}

	// 从原始地址获取clash的剩余流量信息
	async fetchClashContent(): Promise<{ subInfo: string; content: string }> {
		// 添加调试日志：打印订阅URL
		console.log(`🔗 准备获取clash内容，订阅URL: ${this.clashSubUrl}`);

		const clashContent: ClashContent | null = await this.fetchFromKV();
		if (clashContent) {
			console.log('✅ 从KV缓存中获取到clash内容');
			return { subInfo: clashContent.subInfo, content: clashContent.content };
		}

		console.log('📡 KV缓存为空，开始从原始地址获取clash内容');

		let responseClash: Response | null = null;
		try {
			responseClash = await fetch(this.clashSubUrl, {
				headers: {
					'User-Agent': 'clash.meta',
				},
			});

			console.log(`📈 Fetch响应状态: ${responseClash.status} ${responseClash.statusText}`);

			if (!responseClash.ok) {
				const errorText = await responseClash.text().catch(() => '无法读取错误响应');
				console.error(`❌ Fetch失败: ${responseClash.status} ${responseClash.statusText}, 响应内容: ${errorText}`);
				throw Error(`Failed to fetch subscription content ${this.clashSubUrl}, status: ${responseClash.status}, text: ${errorText}`);
			}

			const subInfo = responseClash.headers.get('subscription-userinfo') || '';
			const content = await responseClash.text();

			console.log(`✅ 成功获取clash内容，subInfo: ${subInfo}, 内容长度: ${content.length}`);

			// 异步保存到KV，不等待完成以减少响应时间
			this.saveToKV({ subInfo, content }).catch(error => {
				console.warn('保存到KV失败:', error);
			});
			
			return { subInfo, content };
		} catch (error) {
			console.error(`❌ 获取clash内容时发生错误:`, error);
			console.error(`❌ 错误详情: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		} finally {
			// 确保响应流被正确释放
			if (responseClash && responseClash.body) {
				try {
					await responseClash.body.cancel();
				} catch (e) {
					// 忽略 cancel 错误
				}
			}
		}
	}

	async saveToKV({ subInfo, content }: { subInfo: string; content: string }) {
		const env = GlobalConfig.env;
		const clashContent: ClashContent = { subInfo, content, fetchTime: new Date() };
		await env?.USERS_KV.put(KvKey(this.clashSubUrl), JSON.stringify(clashContent));
	}

	async fetchFromKV(expireCheck: boolean = true): Promise<ClashContent | null> {
		const env = GlobalConfig.env;
		const clashContentStr = await env?.USERS_KV.get(KvKey(this.clashSubUrl));
		if (clashContentStr == null) {
			console.log('🔑 从KV中获取到clash内容 为空');
			return null;
		}

		const clashContent = JSON.parse(clashContentStr) as ClashContent;
		// 将字符串转换回 Date 对象
		clashContent.fetchTime = new Date(clashContent.fetchTime);

		if (expireCheck && clashContent.fetchTime.getTime() + cacheAvailableTime < Date.now()) {
			console.log('🔑 从KV中获取到clash内容 已过期');
			return null;
		}
		const formatTime = (clashContent.fetchTime.getTime() + cacheAvailableTime - Date.now()) / 1000;
		console.log(`🔑 从KV中获取到clash内容 有效时间：${formatTime}s`);
		return clashContent;
	}

	/// 读取远程内容（带重试机制）
	static async fetchRawContent(url: string, maxRetries: number = 3): Promise<string> {
		console.log(`🌐 开始获取远程内容: ${url} (最大重试次数: ${maxRetries})`);

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			console.log(`🔄 第 ${attempt} 次尝试获取: ${url}`);

			let response: Response | null = null;
			try {
				// 增加超时时间，特别针对可能的服务器响应慢的问题
				const timeoutSignal = AbortSignal.timeout(30000); // 30秒超时

				response = await fetch(url, {
					headers: {
						'User-Agent': 'clash.meta',
						'Accept': 'text/plain, text/yaml, application/x-yaml, */*',
						'Accept-Encoding': 'gzip, deflate, br',
						'Connection': 'keep-alive',
					},
					signal: timeoutSignal,
				});

				console.log(`📊 fetchRawContent响应状态: ${response.status} ${response.statusText}`);

				// 记录重要的响应头信息
				const importantHeaders = {
					'content-type': response.headers.get('content-type'),
					'content-length': response.headers.get('content-length'),
					'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
					'cache-control': response.headers.get('cache-control'),
					'last-modified': response.headers.get('last-modified'),
					'cf-ray': response.headers.get('cf-ray'),
					'server': response.headers.get('server')
				};
				console.log(`📊 重要响应头:`, importantHeaders);

				if (!response.ok) {
					const errorText = await response.text().catch(() => '无法读取错误响应');
					console.error(`❌ fetchRawContent失败: ${response.status} ${response.statusText}, 响应内容: ${errorText}`);

					// 对于特定错误码进行重试
					if (this.shouldRetry(response.status) && attempt < maxRetries) {
						const waitTime = attempt * 2000; // 递增等待时间：2s, 4s, 6s
						console.log(`⏳ 将在 ${waitTime}ms 后重试... (状态码: ${response.status})`);
						await this.sleep(waitTime);
						continue;
					}

					throw Error(`Failed to fetch rule content ${url}, status: ${response.status}, text: ${errorText}`);
				}

				const content = await response.text();
				console.log(`✅ 成功获取远程内容，长度: ${content.length}, URL: ${url}, 尝试次数: ${attempt}`);

				return content;
			} catch (error) {
				console.error(`❌ fetchRawContent第 ${attempt} 次尝试发生错误:`, error);
				console.error(`❌ 错误详情: ${error instanceof Error ? error.message : String(error)}`);

				// 如果是网络错误且还有重试机会
				if (attempt < maxRetries && this.shouldRetryError(error)) {
					const waitTime = attempt * 3000; // 递增等待时间：3s, 6s, 9s
					console.log(`⏳ 网络错误，将在 ${waitTime}ms 后重试...`);
					await this.sleep(waitTime);
					continue;
				}

				// 最后一次尝试失败，抛出错误
				console.error(`❌ 所有重试尝试均失败，URL: ${url}`);
				throw new Error(`Failed to fetch rule content ${url} after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`);
			} finally {
				// 确保响应流被正确释放
				if (response && response.body) {
					try {
						await response.body.cancel();
					} catch (e) {
						// 忽略 cancel 错误
					}
				}
			}
		}

		throw new Error(`Failed to fetch rule content ${url} after ${maxRetries} attempts`);
	}

	// 判断是否应该重试（基于HTTP状态码）
	private static shouldRetry(statusCode: number): boolean {
		// 522: Cloudflare connection timeout
		// 524: Cloudflare timeout
		// 502: Bad gateway
		// 503: Service unavailable
		// 504: Gateway timeout
		// 429: Too many requests
		return [522, 524, 502, 503, 504, 429].includes(statusCode);
	}

	// 判断是否应该重试（基于错误类型）
	private static shouldRetryError(error: any): boolean {
		if (error instanceof Error) {
			const errorMessage = error.message.toLowerCase();
			return errorMessage.includes('fetch failed') ||
				   errorMessage.includes('timeout') ||
				   errorMessage.includes('network') ||
				   errorMessage.includes('connection') ||
				   errorMessage.includes('abort');
		}
		return false;
	}

	// 睡眠函数
	private static sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}
