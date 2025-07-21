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

		try {
			const responseClash = await fetch(this.clashSubUrl, {
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

			this.saveToKV({ subInfo, content });
			return { subInfo, content };
		} catch (error) {
			console.error(`❌ 获取clash内容时发生错误:`, error);
			console.error(`❌ 错误详情: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
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

	/// 读取远程内容
	static async fetchRawContent(url: string): Promise<string> {
		const response = await fetch(url);
		if (!response.ok) {
			throw Error(`Failed to fetch rule content ${url}`);
		}
		return response.text();
	}
}
