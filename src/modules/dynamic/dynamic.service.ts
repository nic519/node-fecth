import { getDb } from '@/db';
import { dynamic } from '@/db/schema';
import { formatDate } from '@/utils/dateUtils';
import { hashUrl } from '@/utils/hashUtils';
import { httpClient } from '@/utils/http/client';
import { safeError, safeString } from '@/utils/logHelper';
import { logger } from '@/utils/request/network.config';
import { inArray } from 'drizzle-orm';

import { SSRToClashConverter } from '@/modules/yamlMerge/rawToClash/SSRToClashConverter';
import { CommonUtils } from '@/utils/commonUtils';
import type { DynamicSummary } from '@/types/openapi-schemas';

type DynamicRow = typeof dynamic.$inferSelect;

export interface DynamicContent {
	id: string;
	url: string;
	content: string;
	traffic: string | null;
	updatedAt: string;
}

export class DynamicService {
	private static db = getDb();

	/**
	 * Fetch content from source URL and save to database
	 * 使用 ky 库进行增强的网络请求，包含自动重试和超时控制
	 */
	static async fetchAndSave(url: string, options: { retries?: number; useProxy?: boolean } = {}): Promise<DynamicContent> {
		const { retries = 3, useProxy = false } = options;
		const cleanUrl = CommonUtils.normalizeUrl(url);
		try {
			logger.info({ url: cleanUrl }, 'Start fetching dynamic content from source');

			const response = await httpClient.get(CommonUtils.tryProxyUrl(cleanUrl, useProxy), {
				retry: retries
			});

			let content = await response.text();

			// Auto-convert SSR subscription format to Clash YAML
			if (SSRToClashConverter.isValidProtocol(content)) {
				logger.info({ url: cleanUrl }, 'Detected SSR content, converting to Clash format');
				try {
					content = SSRToClashConverter.convert(content);
				} catch (e) {
					logger.error({ url: cleanUrl, error: safeError(e) }, 'Failed to convert SSR content to Clash format');
					// Keep original content if conversion fails
				}
			}

			const traffic = response.headers.get('Subscription-Userinfo') || null;
			const id = await hashUrl(cleanUrl);
			const now = new Date();
			const formattedDate = formatDate(now);

			await this.db.insert(dynamic).values({
				id,
				url: cleanUrl,
				content,
				traffic,
				updatedAt: formattedDate,
			}).onConflictDoUpdate({
				target: dynamic.id,
				set: {
					content,
					traffic,
					updatedAt: formattedDate,
				},
			});

			logger.info({ id, url: cleanUrl }, 'Dynamic content saved to database');

			return {
				id,
				url: cleanUrl,
				content,
				traffic,
				updatedAt: formattedDate,
			};
		} catch (error: unknown) {
			// ky 抛出的错误包含了详细信息
			const safeMsg = safeError(error);
			const stack = error instanceof Error ? error.stack : undefined;
			const safeStack = safeString(stack || '', 2048);
			logger.error({ url: cleanUrl, error: safeMsg, stack: safeStack }, 'Failed to fetch and save dynamic content');
			throw error;
		}
	}

	/**
	 * Get content from database by URL
	 */
	static async getByUrl(url: string): Promise<DynamicContent | null> {
		try {
			// 尝试原始 URL
			const id1 = await hashUrl(url);

			// 尝试清理后的 URL
			const cleanUrl = CommonUtils.normalizeUrl(url);
			const id2 = await hashUrl(cleanUrl);

			// 查询 ID 为 id1 或 id2 的记录
			const [result] = await this.db.select().from(dynamic)
				.where(inArray(dynamic.id, [id1, id2]))
				.limit(1);

			if (!result) return null;

			return {
				id: result.id,
				url: result.url,
				content: result.content,
				traffic: result.traffic,
				updatedAt: result.updatedAt,
			};
		} catch (error) {
			logger.error({ url, error }, 'Failed to get dynamic content from database');
			return null;
		}
	}

	/**
	 * Get content with caching strategy
	 * 1. Try to get valid cache from DB
	 * 2. If expired or missing, fetch from source and save
	 * @param url Source URL
	 * @param ttlMs Cache Time-To-Live in milliseconds (default: 5 minutes)
	 */
	static async getWithCache(url: string, ttlMs: number = 5 * 60 * 1000): Promise<DynamicContent> {
		const cached = await this.getByUrl(url);

		if (cached) {
			const updatedAt = new Date(cached.updatedAt.replace(' ', 'T')).getTime();
			const now = Date.now();

			if (now - updatedAt < ttlMs) {
				logger.info({ url }, 'Cache hit: returning valid cached content');
				return cached;
			}
			logger.info({ url }, 'Cache expired: fetching fresh content');
		} else {
			logger.info({ url }, 'Cache miss: fetching fresh content');
		}

		try {
			return await this.fetchAndSave(url);
		} catch (error) {
			// If fetch fails but we have stale cache, return it as fallback
			if (cached) {
				logger.warn({ url, error }, 'Fetch failed: returning stale cache as fallback');
				return cached;
			}
			throw error;
		}
	}

	/**
	 * Get multiple contents by URLs
	 */
	static async getSummaryByUrls(urls: string[]): Promise<DynamicSummary[]> {
		try {
			// 构造查询集合：包含原始 URL 和清理后的 URL
			const searchUrls = new Set<string>();
			urls.forEach(u => {
				if (u) {
					searchUrls.add(u);
					const clean = CommonUtils.normalizeUrl(u);
					if (clean) searchUrls.add(clean);
				}
			});

			const results = await this.db.select().from(dynamic)
				.where(inArray(dynamic.url, Array.from(searchUrls)));

			return results.map((r: DynamicRow) => ({
				id: r.id,
				url: r.url,
				traffic: r.traffic,
				updatedAt: r.updatedAt,
			}));
		} catch (error) {
			logger.error({ urls, error }, 'Failed to get dynamic contents from database');
			return [];
		}
	}

	/**
	 * Delete content by URL
	 */
	static async deleteByUrl(url: string): Promise<void> {
		try {
			// 尝试删除原始 URL 和清理后的 URL 对应的记录
			const id1 = await hashUrl(url);
			const cleanUrl = CommonUtils.normalizeUrl(url);
			const id2 = await hashUrl(cleanUrl);

			await this.db.delete(dynamic).where(inArray(dynamic.id, [id1, id2]));
			logger.info({ url }, 'Dynamic content deleted');
		} catch (error) {
			logger.error({ url, error }, 'Failed to delete dynamic content');
			throw error;
		}
	}
}
