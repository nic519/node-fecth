import { getServerDb } from '@/server/db';
import { ensureDynamicHistoryTable } from '@/db/dynamic-migrations';
import { dynamic, dynamicHistory } from '@/db/schema';
import { formatDate } from '@/utils/dateUtils';
import { hashUrl } from '@/utils/hashUtils';
import { httpClient } from '@/utils/http/client';
import { safeError, safeString } from '@/utils/logHelper';
import { logger } from '@/utils/request/network.config';
import { and, asc, desc, eq, inArray, isNull, lt, or } from 'drizzle-orm';

import { SSRToClashConverter } from '@/modules/yamlMerge/rawToClash/SSRToClashConverter';
import type { SubscriptionProxyProvider } from '@/types/api-schemas';
import { CommonUtils } from '@/utils/commonUtils';
import type { DynamicSummary } from '@/types/api-schemas';
import { resolveSubscriptionFetchUrl } from '@/modules/user/subscription-proxy';
import type { DynamicHistoryCursor, DynamicHistoryPage, UsageSeries } from '@/types/schema/dynamic';
import { parseTrafficSnapshot } from '@/utils/trafficUtils';

type DynamicRow = typeof dynamic.$inferSelect;
type DynamicHistoryRow = typeof dynamicHistory.$inferSelect;
const HISTORY_PAGE_SIZE = 50;
const USAGE_SERIES_QUERY_LIMIT = 5000;
const MAX_USAGE_SERIES_POINTS = 240;

/**
 * 从一条历史记录解析出曲线点与到期时间（兼容仅有 traffic 文本的旧格式）。
 */
function parseUsageRow(row: DynamicHistoryRow): { point: UsageSeries['points'][number] | null; expiresAtMs: number | null } {
	const legacy = row.traffic && (
		row.uploadBytes === null || row.downloadBytes === null || row.totalBytes === null || row.expiresAtMs === null
	) ? parseTrafficSnapshot(row.traffic) : null;
	const upload = row.uploadBytes ?? legacy?.uploadBytes ?? null;
	const download = row.downloadBytes ?? legacy?.downloadBytes ?? null;
	const total = row.totalBytes ?? legacy?.totalBytes ?? null;
	const expiresAtMs = row.expiresAtMs ?? legacy?.expiresAtMs ?? null;
	if (row.fetchedAtMs === null || upload === null || download === null || total === null || total <= 0) {
		return { point: null, expiresAtMs };
	}
	return {
		point: { t: row.fetchedAtMs, remainingBytes: Math.max(0, total - upload - download), totalBytes: total },
		expiresAtMs,
	};
}

/**
 * 渲染前降采样到至多 MAX_USAGE_SERIES_POINTS 个点，始终保留首尾。
 */
function downsampleUsagePoints(points: UsageSeries['points']): UsageSeries['points'] {
	if (points.length <= MAX_USAGE_SERIES_POINTS) return points;
	const stride = Math.ceil(points.length / MAX_USAGE_SERIES_POINTS);
	const sampled = points.filter((_, index) => index % stride === 0);
	const last = points[points.length - 1];
	if (sampled[sampled.length - 1] !== last) sampled.push(last);
	return sampled;
}

export interface DynamicContent {
	id: string;
	url: string;
	content: string;
	traffic: string | null;
	updatedAt: string;
}

export class DynamicService {
	private static db = getServerDb();

	/**
	 * Fetch content from source URL and save to database
	 * 使用 ky 库进行增强的网络请求，包含自动重试和超时控制
	 */
	static async fetchAndSave(
		url: string,
		options: { retries?: number; proxyProvider?: SubscriptionProxyProvider; runtimeEnv?: NodeJS.ProcessEnv } = {},
	): Promise<DynamicContent> {
		const { retries = 3, proxyProvider, runtimeEnv } = options;
		const cleanUrl = CommonUtils.normalizeUrl(url);
		const requestUrl = resolveSubscriptionFetchUrl(cleanUrl, proxyProvider, runtimeEnv);
		try {
			logger.info({ url: cleanUrl, requestUrl, proxyProvider }, 'Start fetching dynamic content from source');

			const response = await httpClient.get(requestUrl, {
				retry: retries
			});

			let content = await response.text();
			const fetchedAt = new Date();

			// 自动转换 SSR 订阅格式为 Clash YAML 格式
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
			const updatedAt = formatDate(fetchedAt);
			const snapshot = { traffic, updatedAt };
			const latest = {
				id,
				url: cleanUrl,
				content,
				...snapshot,
			};

			await ensureDynamicHistoryTable(this.db);
			await this.db.batch([
				this.db.insert(dynamic).values(latest).onConflictDoUpdate({
					target: dynamic.id,
					set: { content, ...snapshot },
				}),
				this.db.insert(dynamicHistory).values({
					dynamicId: id,
					fetchedAtMs: fetchedAt.getTime(),
					...snapshot,
					...parseTrafficSnapshot(traffic),
				}),
			]);

			logger.info({ id, url: cleanUrl }, 'Dynamic content saved to database');

			return latest;
		} catch (error: unknown) {
			// ky 抛出的错误包含了详细信息
			const safeMsg = safeError(error);
			const stack = error instanceof Error ? error.stack : undefined;
			const safeStack = safeString(stack || '', 2048);
			logger.error({ url: cleanUrl, error: safeMsg, stack: safeStack }, 'Failed to fetch and save dynamic content');
			throw error;
		}
	}

	static async getHistory(url: string, cursor?: DynamicHistoryCursor): Promise<DynamicHistoryPage> {
		const cleanUrl = CommonUtils.normalizeUrl(url);
		const ids = await Promise.all([...new Set([url, cleanUrl])].map(hashUrl));
		await ensureDynamicHistoryTable(this.db);

		const { dynamicId, fetchedAtMs, id } = dynamicHistory;
		const older = cursor && (cursor.fetchedAtMs === null
			? and(isNull(fetchedAtMs), lt(id, cursor.id))
			: or(
				lt(fetchedAtMs, cursor.fetchedAtMs),
				and(eq(fetchedAtMs, cursor.fetchedAtMs), lt(id, cursor.id)),
				isNull(fetchedAtMs),
			));
		const rows = await this.db.select().from(dynamicHistory)
			.where(and(inArray(dynamicId, ids), older))
			.orderBy(desc(fetchedAtMs), desc(id))
			.limit(HISTORY_PAGE_SIZE + 1);

		const records = rows.slice(0, HISTORY_PAGE_SIZE).map((row) => {
			const legacy = row.traffic && (
				row.uploadBytes === null || row.downloadBytes === null || row.totalBytes === null || row.expiresAtMs === null
			) ? parseTrafficSnapshot(row.traffic) : null;
			const upload = row.uploadBytes ?? legacy?.uploadBytes ?? null;
			const download = row.downloadBytes ?? legacy?.downloadBytes ?? null;
			const totalBytes = row.totalBytes ?? legacy?.totalBytes ?? null;
			return {
				id: row.id,
				fetchedAtMs: row.fetchedAtMs,
				remainingBytes: upload === null || download === null || totalBytes === null
					? null : Math.max(0, totalBytes - upload - download),
				totalBytes,
				expiresAtMs: row.expiresAtMs ?? legacy?.expiresAtMs ?? null,
			};
		});
		const last = records.at(-1);
		return {
			records,
			nextCursor: rows.length > HISTORY_PAGE_SIZE && last ? { id: last.id, fetchedAtMs: last.fetchedAtMs } : null,
		};
	}

	/**
	 * Get full usage series for charting: all history points ascending by time,
	 * downsampled to at most MAX_USAGE_SERIES_POINTS for rendering.
	 */
	static async getUsageSeries(url: string): Promise<UsageSeries> {
		const cleanUrl = CommonUtils.normalizeUrl(url);
		const ids = await Promise.all([...new Set([url, cleanUrl])].map(hashUrl));
		await ensureDynamicHistoryTable(this.db);

		const { dynamicId, fetchedAtMs, id } = dynamicHistory;
		const rows = await this.db.select().from(dynamicHistory)
			.where(inArray(dynamicId, ids))
			.orderBy(asc(fetchedAtMs), asc(id))
			.limit(USAGE_SERIES_QUERY_LIMIT);

		const points: UsageSeries['points'] = [];
		let expiresAtMs: number | null = null;
		for (const row of rows) {
			const parsed = parseUsageRow(row);
			if (parsed.expiresAtMs !== null) expiresAtMs = parsed.expiresAtMs;
			if (parsed.point) points.push(parsed.point);
		}

		return { points: downsampleUsagePoints(points), expiresAtMs };
	}

	/**
	 * Batch version of getUsageSeries: one query for many URLs,
	 * returns a map keyed by the originally requested URL.
	 * 用于运营后台等需要一次性评估大量订阅源的场景（如预测耗尽时间）。
	 */
	static async getUsageSeriesBatch(urls: string[]): Promise<Map<string, UsageSeries>> {
		const result = new Map<string, UsageSeries>();
		if (urls.length === 0) return result;

		const idToUrl = new Map<string, string>();
		await Promise.all(urls.map(async (url) => {
			const cleanUrl = CommonUtils.normalizeUrl(url);
			for (const candidate of new Set([url, cleanUrl])) {
				const id = await hashUrl(candidate);
				if (!idToUrl.has(id)) idToUrl.set(id, url);
			}
		}));
		await ensureDynamicHistoryTable(this.db);

		const { dynamicId, fetchedAtMs, id } = dynamicHistory;
		const rows = await this.db.select().from(dynamicHistory)
			.where(inArray(dynamicId, [...idToUrl.keys()]))
			.orderBy(asc(fetchedAtMs), asc(id))
			.limit(USAGE_SERIES_QUERY_LIMIT * urls.length);

		const grouped = new Map<string, UsageSeries>();
		for (const row of rows) {
			const url = idToUrl.get(row.dynamicId);
			if (!url) continue;
			let entry = grouped.get(url);
			if (!entry) {
				entry = { points: [], expiresAtMs: null };
				grouped.set(url, entry);
			}
			const parsed = parseUsageRow(row);
			if (parsed.expiresAtMs !== null) entry.expiresAtMs = parsed.expiresAtMs;
			if (parsed.point) entry.points.push(parsed.point);
		}

		for (const url of urls) {
			const entry = grouped.get(url);
			result.set(url, entry
				? { points: downsampleUsagePoints(entry.points), expiresAtMs: entry.expiresAtMs }
				: { points: [], expiresAtMs: null });
		}
		return result;
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
	static async getWithCache(
		url: string,
		ttlMs: number = 5 * 60 * 1000,
		proxyProvider?: SubscriptionProxyProvider,
		runtimeEnv?: NodeJS.ProcessEnv,
		onStale?: () => void,
	): Promise<DynamicContent> {
		const cached = await this.getByUrl(url);

		if (cached) {
			const updatedAt = new Date(`${cached.updatedAt.replace(' ', 'T')}+08:00`).getTime();
			const age = Date.now() - updatedAt;

			if (age >= 0 && age < ttlMs) {
				logger.info({ url }, 'Cache hit: returning valid cached content');
				return cached;
			}
			logger.info({ url }, 'Cache expired: fetching fresh content');
		} else {
			logger.info({ url }, 'Cache miss: fetching fresh content');
		}

		try {
			return await this.fetchAndSave(url, { proxyProvider, runtimeEnv });
		} catch (error) {
			// If fetch fails but we have stale cache, return it as fallback
			if (cached) {
				logger.warn({ url, error }, 'Fetch failed: returning stale cache as fallback');
				onStale?.();
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
