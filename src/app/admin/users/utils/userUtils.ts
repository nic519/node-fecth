import type { SubscriptionStat, UserAdminConfig } from '@/modules/user/admin.schema';
import { formatTraffic, parseTrafficInfo, type ParsedTrafficInfo } from '@/utils/trafficUtils';

export {
	formatTraffic,
	formatDateTime,
	getTrafficBarColor,
	parseTrafficInfo,
} from '@/utils/trafficUtils';
export type { ParsedTrafficInfo } from '@/utils/trafficUtils';

const DAY_MS = 86400_000;
const DEPLETING_WINDOW_MS = 14 * DAY_MS;

/**
 * 用户异常等级：流量紧张最优先，消耗过快（预测两周内耗尽）其次，即将到期再次，已过期收纳到最后。
 */
export interface UserIssue {
	kind: 'tight' | 'depleting' | 'expiring' | 'expired';
	rank: number;
	label: string;
	detail: string;
}

export const isTightTraffic = (traffic: ParsedTrafficInfo | null): boolean =>
	Boolean(traffic && traffic.total > 0 && traffic.remaining / traffic.total <= 0.2);

export const isExpiringTraffic = (traffic: ParsedTrafficInfo | null): boolean =>
	Boolean(
		traffic?.expire &&
		!traffic.isExpired &&
		traffic.expire * 1000 - Date.now() <= 7 * DAY_MS,
	);

/**
 * 预测耗尽时间是否值得告警：早于到期时间（若有）且在未来两周内。
 */
export function depletingAtMs(stat: Pick<SubscriptionStat, 'traffic' | 'predictedExhaustionAtMs'>, nowMs: number = Date.now()): number | null {
	const predicted = stat.predictedExhaustionAtMs;
	if (!predicted) return null;
	const traffic = parseTrafficInfo(stat.traffic || null);
	const expiryMs = traffic?.expire ? traffic.expire * 1000 : null;
	const deadline = Math.min(expiryMs ?? Number.POSITIVE_INFINITY, nowMs + DEPLETING_WINDOW_MS);
	return predicted < deadline ? predicted : null;
}

const formatShortDate = (ms: number) => {
	const date = new Date(ms);
	return `${date.getMonth() + 1}/${date.getDate()}`;
};

/**
 * 取用户所有订阅源中最需要关注的一个问题；没有异常时返回 null。
 */
export function userIssue(user: UserAdminConfig): UserIssue | null {
	let worst: UserIssue | null = null;
	for (const stat of user.subscriptionStats ?? []) {
		const traffic = parseTrafficInfo(stat.traffic || null);
		if (!traffic) continue;
		const name = stat.name || '订阅源';
		let issue: UserIssue | null = null;
		if (traffic.isExpired) {
			issue = { kind: 'expired', rank: 9, label: '已过期', detail: name };
		} else if (isTightTraffic(traffic)) {
			issue = { kind: 'tight', rank: 0, label: '流量紧张', detail: `${name} 剩余 ${formatTraffic(traffic.remaining)}` };
		} else {
			const depletingAt = depletingAtMs(stat);
			if (depletingAt !== null) {
				issue = { kind: 'depleting', rank: 1, label: '消耗过快', detail: `${name} 预计 ${formatShortDate(depletingAt)} 用完` };
			} else if (isExpiringTraffic(traffic)) {
				issue = { kind: 'expiring', rank: 2, label: '即将到期', detail: name };
			}
		}
		if (issue && (!worst || issue.rank < worst.rank)) worst = issue;
	}
	return worst;
}

export interface AggregateTraffic {
	used: number;
	total: number;
	remaining: number;
	usagePercent: number;
	// 有流量快照的订阅数 / 远程订阅总数。
	available: number;
	remote: number;
}

/**
 * 汇总用户全部远程订阅的流量；没有任何流量快照时返回 null。
 */
export function aggregateTraffic(user: UserAdminConfig): AggregateTraffic | null {
	const stats = user.subscriptionStats ?? [];
	const parsed = stats
		.map((stat) => parseTrafficInfo(stat.traffic || null))
		.filter((traffic): traffic is ParsedTrafficInfo => Boolean(traffic && traffic.total > 0));
	if (!parsed.length) return null;
	const used = parsed.reduce((sum, item) => sum + item.used, 0);
	const total = parsed.reduce((sum, item) => sum + item.total, 0);
	return {
		used,
		total,
		remaining: Math.max(0, total - used),
		usagePercent: total > 0 ? Math.round((used / total) * 10000) / 100 : 0,
		available: parsed.length,
		remote: stats.length,
	};
}

export type UserScope = 'all' | 'attention' | 'depleting' | 'expiring' | 'no-expiry';
export type UserSort = 'attention' | 'recent' | 'remaining';
export type SortDirection = 'asc' | 'desc';

export const DEFAULT_USER_SORT_DIR: Record<UserSort, SortDirection> = {
	attention: 'asc',
	recent: 'desc',
	remaining: 'asc',
};

export function matchUserScope(user: UserAdminConfig, scope: UserScope): boolean {
	if (scope === 'all') return true;
	const issue = userIssue(user);
	if (scope === 'attention') return Boolean(issue && issue.kind !== 'expired');
	if (scope === 'depleting') return issue?.kind === 'depleting';
	if (scope === 'expiring') return issue?.kind === 'expiring';
	// 到期未提供：有远程订阅，但所有流量快照都缺少到期时间。
	const stats = user.subscriptionStats ?? [];
	const hasRemote = stats.length > 0;
	const allMissingExpiry = stats.every((stat) => !parseTrafficInfo(stat.traffic || null)?.expire);
	return hasRemote && allMissingExpiry;
}

const NO_ISSUE_RANK = 3;

export function compareUsers(sort: UserSort, dir: SortDirection = DEFAULT_USER_SORT_DIR[sort]) {
	return (a: UserAdminConfig, b: UserAdminConfig): number => {
		let cmp = 0;
		if (sort === 'recent') {
			cmp = Date.parse(a.updatedAt ?? '') - Date.parse(b.updatedAt ?? '');
		} else if (sort === 'remaining') {
			const remainingOf = (user: UserAdminConfig) => aggregateTraffic(user)?.remaining ?? Number.POSITIVE_INFINITY;
			cmp = remainingOf(a) - remainingOf(b);
		} else {
			// 异常优先：按问题等级排序，平级时剩余流量少的在前，没有流量数据的在最后。
			const rankOf = (user: UserAdminConfig) => userIssue(user)?.rank ?? NO_ISSUE_RANK;
			const remainingOf = (user: UserAdminConfig) => aggregateTraffic(user)?.remaining ?? Number.POSITIVE_INFINITY;
			cmp = rankOf(a) - rankOf(b) || remainingOf(a) - remainingOf(b);
		}
		return dir === 'asc' ? cmp : -cmp;
	};
}
