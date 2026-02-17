import { logger } from './network.config';
import { DynamicService, DynamicContent } from '@/modules/dynamic/dynamic.service';

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
		const cached: ClashContent | null = await this.fetchFromKV();

		if (cached && !this.isExpired(cached)) {
			logger.info({ url: this.clashSubUrl }, '使用有效期的缓存数据');
			return cached;
		}

		// 2. 从源地址获取并更新缓存
		return await this.fetchAndSave(cached);
	}

	/**
	 * 直接从KV获取缓存内容（不检查过期）
	 * 用于管理后台等场景，只需要读取缓存数据
	 */
	async fetchFromKV(): Promise<ClashContent | null> {
		try {
			const result = await DynamicService.getByUrl(this.clashSubUrl);
			if (!result) {
				logger.debug({ url: this.clashSubUrl }, '缓存不存在');
				return null;
			}

			// Parse updatedAt string to Date
			// Assuming format is YYYY-MM-DD HH:mm:ss or similar
			const fetchTime = new Date(result.updatedAt.replace(' ', 'T')); // Convert to ISO-like for parsing if needed
			// But wait, if it's local time string, new Date('YYYY-MM-DD HH:mm:ss') might be tricky.
			// If we saved it as 'YYYY-MM-DD HH:mm:ss' (Local), parsing it back:
			// new Date('2023-01-01 10:00:00') -> Local time in browser/Node (usually).

			// However, if we are in UTC env (Worker), new Date('...') might treat as UTC or fail.
			// Let's assume standard behavior.

			return {
				subInfo: result.traffic || '',
				content: result.content,
				fetchTime: fetchTime,
			};
		} catch (error) {
			logger.error({ url: this.clashSubUrl, error }, '从数据库读取缓存失败');
			return null;
		}
	}

	// ==================== 私有方法 - 缓存管理 ====================

	/**
	 * 检查缓存是否过期
	 */
	private isExpired(cached: ClashContent): boolean {
		const fetchTime = new Date(cached.fetchTime).getTime();
		return fetchTime + CACHE_TTL < Date.now();
	}

	// ==================== 私有方法 - 内容获取 ====================

	/**
	 * 从源地址获取内容并保存
	 */
	private async fetchAndSave(cacheData: ClashContent | null = null): Promise<ClashContent> {
		try {
			const result = await DynamicService.fetchAndSave(this.clashSubUrl);

			// Parse fetchTime
			const fetchTime = new Date(result.updatedAt.replace(' ', 'T'));

			return {
				subInfo: result.traffic || '',
				content: result.content,
				fetchTime: fetchTime,
			};
		} catch (error) {
			logger.error({ url: this.clashSubUrl, error }, '获取并保存内容失败');

			if (cacheData) {
				logger.warn('使用过期缓存作为降级');
				return cacheData;
			}
			throw error;
		}
	}
}
