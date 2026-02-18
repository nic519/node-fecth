import { getDb } from '@/db';
import { dynamic } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { hashUrl } from '@/utils/hashUtils';
import { formatDate } from '@/utils/dateUtils';
import { logger } from '@/utils/request/network.config';
import { httpClient } from '@/utils/http/client';
import { safeError, safeString } from '@/utils/logHelper';

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
	static async fetchAndSave(url: string, retries = 3): Promise<DynamicContent> {
		try {
			logger.info({ url }, 'Start fetching dynamic content from source');

			// 使用统一的 HTTP 客户端发起请求
			// ky 会自动处理重试 (默认3次) 和超时 (默认15秒)
			// 如果需要覆盖默认重试次数，可以在这里配置
			const response = await httpClient.get(url, {
				retry: retries
			});

			const content = await response.text();
			const traffic = response.headers.get('Subscription-Userinfo') || null;
			const id = await hashUrl(url);
			const now = new Date();
			const formattedDate = formatDate(now);

			await this.db.insert(dynamic).values({
				id,
				url,
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

			logger.info({ id, url }, 'Dynamic content saved to database');

			return {
				id,
				url,
				content,
				traffic,
				updatedAt: formattedDate,
			};
		} catch (error: any) {
			// ky 抛出的错误包含了详细信息
			const safeMsg = safeError(error);
			const safeStack = safeString(error?.stack || '', 2048);
			logger.error({ url, error: safeMsg, stack: safeStack }, 'Failed to fetch and save dynamic content');
			throw error;
		}
	}

	/**
	 * Get content from database by URL
	 */
	static async getByUrl(url: string): Promise<DynamicContent | null> {
		try {
			const id = await hashUrl(url);
			const [result] = await this.db.select().from(dynamic).where(eq(dynamic.id, id)).limit(1);

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
	 * Get multiple contents by URLs
	 */
	static async getByUrls(urls: string[]): Promise<DynamicContent[]> {
		try {
			// Note: This query is not efficient if we want to query by URL string directly if not indexed or if we need ID.
			// However, the table stores `url` column, so we can query by it.
			// But wait, the table primary key is ID (hash).
			// If we query by `url` column, it might be slow without index, but for now it's fine.
			// Or we can compute hashes for all URLs.

			const results = await this.db.select().from(dynamic).where(inArray(dynamic.url, urls));

			return results.map((r: DynamicRow) => ({
				id: r.id,
				url: r.url,
				content: r.content,
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
			const id = await hashUrl(url);
			await this.db.delete(dynamic).where(eq(dynamic.id, id));
			logger.info({ id, url }, 'Dynamic content deleted');
		} catch (error) {
			logger.error({ url, error }, 'Failed to delete dynamic content');
			throw error;
		}
	}
}
