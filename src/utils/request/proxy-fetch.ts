import { GlobalConfig } from '@/config/global-config';
import { logger } from './network.config';

// ==================== 常量定义 ====================

/** KV缓存键前缀 */
const KV_KEY_PREFIX = 'clash-sub:';

/** 缓存有效期：5分钟 */
const CACHE_TTL = 5 * 60 * 1000;

// ==================== 类型定义 ====================

/** Clash订阅内容缓存结构 */
interface ClashContent {
	/** 订阅信息（流量、过期时间等） */
	subInfo: string;
	/** Clash配置内容 */
	content: string;
	/** 获取时间 */
	fetchTime: Date;
}

/** Clash订阅返回结构 */
export interface ClashSubscription {
	subInfo: string;
	content: string;
}

// ==================== 工具函数 ====================

/**
 * 生成KV存储键
 */
function generateKvKey(url: string): string {
	return `${KV_KEY_PREFIX}${url}`;
}

/**
 * 安全的JSON解析，自动处理BOM和控制字符
 * @param jsonString JSON字符串
 * @param fallbackValue 解析失败时的默认值
 */
function safeJsonParse<T>(jsonString: string, fallbackValue: T | null = null): T | null {
	try {
		// 清理不可见字符
		const cleaned = jsonString
			.replace(/^\uFEFF/, '') // 移除BOM
			.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // 移除控制字符

		if (!cleaned.trim()) {
			throw new Error('JSON字符串为空');
		}

		return JSON.parse(cleaned);
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
				dataLength: jsonString.length,
				preview: jsonString.substring(0, 200),
			},
			'JSON解析失败'
		);
		return fallbackValue;
	}
}

/**
 * 计算数据大小
 */
function calculateSize(data: string): { bytes: number; mb: string } {
	const bytes = new Blob([data]).size;
	const mb = (bytes / (1024 * 1024)).toFixed(2);
	return { bytes, mb };
}

/**
 * 带超时的 fetch 请求
 * @param url 请求URL
 * @param options fetch选项
 * @param timeoutMs 超时时间（毫秒），默认20秒
 */
async function fetchWithTimeout(
	url: string,
	options: RequestInit = {},
	timeoutMs: number = 20000
): Promise<Response> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal,
		});
		clearTimeout(timeoutId);
		return response;
	} catch (error) {
		clearTimeout(timeoutId);
		// 如果是 AbortError，转换为超时错误
		if (error instanceof Error && error.name === 'AbortError') {
			throw new Error('请求超时');
		}
		throw error;
	}
}

// ==================== 主类 ====================

/**
 * Clash订阅流量管理工具
 * 提供订阅内容获取、KV缓存管理等功能
 */
export class ProxyFetch {
	constructor(private readonly clashSubUrl: string) { }

	// ==================== 公共方法 ====================

	/**
	 * 获取Clash订阅内容（优先使用缓存）
	 * @returns 订阅信息和配置内容
	 */
	async fetchClashContent(): Promise<ClashSubscription> {
		logger.info({ url: this.clashSubUrl }, '获取Clash订阅');

		// 1. 尝试从缓存获取
		const cached = await this.getCachedContent();
		if (cached) {
			logger.info('使用缓存数据');
			return cached;
		}

		// 2. 从源地址获取
		return await this.fetchFromSource();
	}

	/**
	 * 直接从KV获取缓存内容（不检查过期）
	 * 用于管理后台等场景，只需要读取缓存数据
	 */
	async fetchFromKV(): Promise<ClashContent | null> {
		return await this.fetchFromKVInternal();
	}

	// ==================== 私有方法 - 缓存管理 ====================

	/**
	 * 从KV缓存获取有效内容
	 */
	private async getCachedContent(): Promise<ClashSubscription | null> {
		const cached = await this.fetchFromKVInternal();
		if (!cached) {
			return null;
		}

		// 检查是否过期
		if (this.isExpired(cached)) {
			logger.debug('缓存已过期');
			return null;
		}

		return {
			subInfo: cached.subInfo,
			content: cached.content,
		};
	}

	/**
	 * 从KV读取缓存数据（内部方法）
	 */
	private async fetchFromKVInternal(): Promise<ClashContent | null> {
		const env = GlobalConfig.env;
		const key = generateKvKey(this.clashSubUrl);
		const data = await env?.USERS_KV.get(key);

		if (!data) {
			logger.debug({ key }, '缓存不存在');
			return null;
		}

		const { mb } = calculateSize(data);
		logger.debug({ size: `${mb}MB` }, '读取缓存');

		// 解析缓存数据
		const parsed = safeJsonParse<ClashContent>(data, null);
		if (!parsed) {
			logger.error({ key }, '缓存数据损坏，将清除');
			await this.clearCache();
			return null;
		}

		return parsed;
	}

	/**
	 * 保存内容到KV缓存
	 */
	private async saveToKV(data: ClashSubscription): Promise<boolean> {
		const env = GlobalConfig.env;
		if (!env?.USERS_KV) {
			logger.error('KV环境未初始化');
			return false;
		}

		const key = generateKvKey(this.clashSubUrl);
		const cacheData: ClashContent = {
			...data,
			fetchTime: new Date(),
		};
		const jsonString = JSON.stringify(cacheData);

		// 检查大小限制
		const { bytes, mb } = calculateSize(jsonString);
		logger.debug({ size: `${mb}MB`, bytes }, '准备保存缓存');

		try {
			// 写入KV（Cloudflare KV 的 put 操作是可靠的，成功返回即表示数据会被持久化）
			await env.USERS_KV.put(key, jsonString);
			logger.info({ key, size: `${mb}MB` }, '缓存已写入KV');
			return true;
		} catch (error) {
			logger.error(
				{
					error: error instanceof Error ? error.message : String(error),
					key,
				},
				'KV保存失败'
			);
			return false;
		}
	}

	/**
	 * 清除缓存
	 */
	private async clearCache(): Promise<void> {
		const env = GlobalConfig.env;
		const key = generateKvKey(this.clashSubUrl);

		try {
			await env?.USERS_KV.delete(key);
			logger.info({ key }, '缓存已清除');
		} catch (error) {
			logger.error(
				{
					error: error instanceof Error ? error.message : String(error),
					key,
				},
				'清除缓存失败'
			);
		}
	}

	/**
	 * 检查缓存是否过期
	 */
	private isExpired(cached: ClashContent): boolean {
		const fetchTime = new Date(cached.fetchTime).getTime();
		return fetchTime + CACHE_TTL < Date.now();
	}

	// ==================== 私有方法 - 内容获取 ====================

	/**
	 * 从源地址获取内容
	 */
	private async fetchFromSource(): Promise<ClashSubscription> {
		logger.info({ url: this.clashSubUrl }, '开始从源地址获取');

		// 尝试获取过期缓存，作为降级方案
		const staleCache = await this.fetchFromKVInternal();

		try {
			// 使用带超时的 fetch，设置为20秒（小于api.proxy.ts的25秒超时）
			const response = await fetchWithTimeout(
				this.clashSubUrl,
				{
					headers: { 'User-Agent': 'clash.meta' },
				},
				20000 // 20秒超时
			);

			if (!response.ok) {
				// 如果有过期缓存，返回过期缓存
				if (staleCache) {
					logger.warn(
						{
							status: response.status,
							hasStaleCache: true,
						},
						'源地址获取失败，使用过期缓存'
					);
					return { subInfo: staleCache.subInfo, content: staleCache.content };
				}
				throw new Error(`获取失败 [${response.status}]`);
			}

			const subInfo = response.headers.get('subscription-userinfo') || '';
			const content = await response.text();

			const { mb } = calculateSize(content);
			logger.info({ size: `${mb}MB`, subInfo }, '从源地址获取成功');

			// 同步保存到缓存（在 Workers 中必须等待，否则响应返回后操作会被中断）
			const saveSuccess = await this.saveToKV({ subInfo, content });
			if (!saveSuccess) {
				logger.warn('缓存保存失败，但不影响当前响应');
			}

			return { subInfo, content };
		} catch (error) {
			// 如果是超时错误，尝试使用过期缓存
			if (error instanceof Error && error.message === '请求超时') {
				if (staleCache) {
					logger.warn(
						{
							hasStaleCache: true,
						},
						'请求超时，使用过期缓存'
					);
					return { subInfo: staleCache.subInfo, content: staleCache.content };
				}
			}

			logger.error(
				{
					error: error instanceof Error ? error.message : String(error),
					url: this.clashSubUrl,
				},
				'从源地址获取失败'
			);
			throw error;
		}
	}
}
