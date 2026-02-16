import { GlobalConfig } from '@/config/global-config';
import { logger } from './network.config';
import { getDb } from '@/db';
import { dynamic } from '@/db/schema';
import { eq } from 'drizzle-orm';

// ==================== 常量定义 ====================

/** 缓存有效期：5分钟 */
const CACHE_TTL = 5 * 60 * 1000;

// ==================== 类型定义 ====================

/** Clash订阅内容缓存结构 */
interface ClashContent {
	subInfo: string;
	content: string;
	fetchTime: Date;
}

// ==================== 工具函数 ====================

/**
 * 计算字符串Hash (SHA-256)
 */
async function hashUrl(message: string): Promise<string> {
	const msgUint8 = new TextEncoder().encode(message);
	const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	return hashHex;
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
	async fetchClashContent(): Promise<ClashContent> {
		logger.info({ url: this.clashSubUrl }, '获取Clash订阅');

		// 1. 尝试从缓存获取
		const cached: ClashContent | null = await this.fetchFromKVInternal();

		if (cached && !this.isExpired(cached)) {
			logger.info({ url: this.clashSubUrl }, '使用有效期的缓存数据');
			return cached;
		}

		// 2. 从源地址获取
		return await this.fetchFromSource(cached);
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
	 * 从数据库读取缓存数据（内部方法）
	 */
	private async fetchFromKVInternal(): Promise<ClashContent | null> {
		const env = GlobalConfig.env;
		const db = getDb(env);
		const url = this.clashSubUrl;

		try {
			const id = await hashUrl(url);
			const [result] = await db.select().from(dynamic).where(eq(dynamic.id, id)).limit(1);

			if (!result) {
				logger.debug({ id, url }, '缓存不存在');
				return null;
			}

			const { mb } = calculateSize(result.content);
			logger.debug({ size: `${mb}MB`, id }, '读取缓存');

			return {
				subInfo: result.traffic || '',
				content: result.content,
				fetchTime: new Date(result.updatedAt),
			};
		} catch (error) {
			logger.error(
				{
					error: error instanceof Error ? error.message : String(error),
					url,
				},
				'从数据库读取缓存失败'
			);
			return null;
		}
	}

	/**
	 * 保存内容到KV缓存 (实际是数据库)
	 */
	private async saveToKV(data: ClashContent): Promise<boolean> {
		const env = GlobalConfig.env;
		const db = getDb(env);
		const url = this.clashSubUrl;

		const { mb } = calculateSize(data.content);

		try {
			const id = await hashUrl(url);
			logger.debug({ size: `${mb}MB`, id }, '准备保存缓存到数据库');

			await db
				.insert(dynamic)
				.values({
					id,
					url,
					content: data.content,
					traffic: data.subInfo,
					updatedAt: data.fetchTime.toISOString(),
				})
				.onConflictDoUpdate({
					target: dynamic.id,
					set: {
						content: data.content,
						traffic: data.subInfo,
						updatedAt: data.fetchTime.toISOString(),
					},
				});

			logger.info({ id, url, size: `${mb}MB` }, '缓存已写入数据库');
			return true;
		} catch (error) {
			logger.error(
				{
					error: error instanceof Error ? error.message : String(error),
					url,
				},
				'数据库保存失败'
			);
			return false;
		}
	}

	/**
	 * 清除缓存
	 */
	private async clearCache(): Promise<void> {
		const env = GlobalConfig.env;
		const db = getDb(env);
		const url = this.clashSubUrl;

		try {
			const id = await hashUrl(url);
			await db.delete(dynamic).where(eq(dynamic.id, id));
			logger.info({ id, url }, '缓存已清除');
		} catch (error) {
			logger.error(
				{
					error: error instanceof Error ? error.message : String(error),
					url,
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
	 * [cacheData] 缓存数据，如果不为空，则在网络请求失败时，会作为降级返回
	 */
	private async fetchFromSource(cacheData: ClashContent | null): Promise<ClashContent> {
		logger.info({ url: this.clashSubUrl }, '开始从源地址获取');

		try {
			const response = await fetch(this.clashSubUrl, {
				headers: { 'User-Agent': 'clash.meta' },
			});

			if (!response.ok) {
				// 如果有过期缓存，返回过期缓存// 尝试获取过期缓存，作为降级方案
				if (cacheData) {
					logger.warn(
						{
							status: response.status,
							hasStaleCache: true,
						},
						'源地址获取失败，使用过期缓存'
					);
					return cacheData;
				}
				throw new Error(`获取失败 [${response.status}]`);
			}

			const subInfo = response.headers.get('subscription-userinfo') || '';
			const content = await response.text();

			const { mb } = calculateSize(content);
			logger.info({ size: `${mb}MB`, subInfo }, '从源地址获取成功');

			// 同步保存到缓存（在 Workers 中必须等待，否则响应返回后操作会被中断）
			const fetchTime = new Date();
			const saveSuccess = await this.saveToKV({ subInfo, content, fetchTime });
			if (!saveSuccess) {
				logger.warn('缓存保存失败，但不影响当前响应');
			}

			return { subInfo, content, fetchTime };
		} catch (error) {
			logger.error(
				{
					error: error instanceof Error ? error.message : String(error),
					url: this.clashSubUrl,
				},
				'从源地址获取失败 使用缓存=' + (cacheData ? '是' : '否')
			);
			if (cacheData) {
				return cacheData;
			}
			throw error;
		}
	}
}
