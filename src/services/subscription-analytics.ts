import type { DbInstance } from '@/server/db';
import { cleanupSubscriptionAnalytics } from '@/services/subscription-analytics-storage';
export { ensureSubscriptionAnalytics, recordSubscriptionAccess, cleanupSubscriptionAnalytics } from '@/services/subscription-analytics-storage';
import type {
  SubscriptionAnalyticsResult,
  SubscriptionIpHeartbeat,
  SubscriptionIpStatus,
  SubscriptionTrend,
  SubscriptionUserActivity,
} from '@/types/subscription-analytics';
import type { HeartbeatWindowDays } from '@/utils/heartbeatBins';

const MAX_ACCESS_LOGS = 50_000;
const ONLINE_WINDOW_MS = 60 * 60 * 1000;
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;
/** 默认心跳采样上限；拉长心跳窗口（14 天）时放宽，避免高频 IP 的左侧格子被截断成空白 */
const DEFAULT_HEARTBEAT_LIMIT = 200;
const EXTENDED_HEARTBEAT_LIMIT = 400;

type AccessLogRow = {
  userId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
};

type HeaderBag = Record<string, unknown>;

function textHeader(headers: HeaderBag, name: string) {
  const value = headers[name];
  if (Array.isArray(value)) return value.find((item): item is string => typeof item === 'string');
  return typeof value === 'string' ? value : undefined;
}

function decodedHeader(headers: HeaderBag, name: string) {
  const value = textHeader(headers, name);
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeIp(value?: string) {
  if (!value) return undefined;

  let candidate = value.split(',')[0]?.trim();
  const forwardedMatch = candidate?.match(/(?:^|;)\s*for=(?:"?)(\[[^\]]+\]|[^;"\s]+)(?:"?)/i);
  if (forwardedMatch?.[1]) candidate = forwardedMatch[1];
  if (!candidate) return undefined;

  candidate = candidate.replace(/^"|"$/g, '');
  if (candidate.startsWith('[') && candidate.includes(']')) {
    return candidate.slice(1, candidate.indexOf(']'));
  }

  const ipv4WithPort = candidate.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  return ipv4WithPort?.[1] ?? candidate;
}

function getRequestIp(headers: HeaderBag) {
  const candidates = [
    textHeader(headers, 'x-real-ip'),
    textHeader(headers, 'x-vercel-forwarded-for'),
    textHeader(headers, 'x-forwarded-for'),
    textHeader(headers, 'forwarded'),
    textHeader(headers, 'cf-connecting-ip'),
  ];

  for (const candidate of candidates) {
    const ip = normalizeIp(candidate);
    if (ip) return ip;
  }
  return undefined;
}

function getClientName(userAgent: string) {
  const normalized = userAgent.toLowerCase();
  if (!userAgent) return '未知客户端';
  if (normalized.includes('clashmetaforandroid')) return 'Clash Meta Android';
  if (normalized.includes('clash-verge') || normalized.includes('clash verge')) return 'Clash Verge';
  if (normalized.includes('clash')) return 'Clash';
  if (normalized.includes('mihomo')) return 'Mihomo';
  if (normalized.includes('shadowrocket')) return 'Shadowrocket';
  if (normalized.includes('stash')) return 'Stash';
  if (normalized.includes('surge')) return 'Surge';
  if (normalized.includes('sing-box') || normalized.includes('singbox')) return 'sing-box';
  return userAgent.split('/')[0]?.trim() || '其他客户端';
}

function getStatus(lastSeenMs: number, nowMs: number): SubscriptionIpStatus {
  const elapsed = Math.max(0, nowMs - lastSeenMs);
  if (elapsed <= ONLINE_WINDOW_MS) return 'online';
  if (elapsed <= RECENT_WINDOW_MS) return 'recent';
  return 'stale';
}

function medianIntervalMinutes(timestamps: number[]) {
  if (timestamps.length < 2) return null;
  const sorted = [...timestamps].sort((a, b) => a - b);
  const intervals = sorted.slice(1).map((value, index) => value - sorted[index]);
  intervals.sort((a, b) => a - b);
  const middle = Math.floor(intervals.length / 2);
  const median = intervals.length % 2 === 0
    ? (intervals[middle - 1] + intervals[middle]) / 2
    : intervals[middle];
  return Math.max(1, Math.round(median / 60_000));
}

function rankedCounts(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * 按固定窗口桶聚合访问趋势：24 小时按小时、7/30 天按天。
 * 只统计访问日志里的真实记录，没有任何外推。
 */
function buildTrend(rows: AccessLogRow[], windowStartMs: number, nowMs: number, rangeDays: 1 | 7 | 30): SubscriptionTrend {
  const granularity = rangeDays === 1 ? 'hour' : 'day';
  const bucketMs = granularity === 'hour' ? 3_600_000 : 86_400_000;
  const bucketCount = rangeDays === 1 ? 24 : rangeDays;
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    start: new Date(windowStartMs + index * bucketMs).toISOString(),
    requests: 0,
    ips: new Set<string>(),
  }));

  for (const row of rows) {
    const timestamp = Date.parse(row.createdAt);
    if (!Number.isFinite(timestamp) || timestamp < windowStartMs || timestamp > nowMs) continue;
    const index = Math.min(bucketCount - 1, Math.floor((timestamp - windowStartMs) / bucketMs));
    buckets[index].requests += 1;

    const headers = row.meta && typeof row.meta === 'object' && !Array.isArray(row.meta)
      ? (row.meta as Record<string, unknown>).headers
      : undefined;
    if (headers && typeof headers === 'object' && !Array.isArray(headers)) {
      const ip = getRequestIp(headers as HeaderBag);
      if (ip) buckets[index].ips.add(ip);
    }
  }

  return {
    granularity,
    points: buckets.map((bucket) => ({ start: bucket.start, requests: bucket.requests, uniqueIps: bucket.ips.size })),
  };
}

function locationName(heartbeat: SubscriptionIpHeartbeat) {
  return heartbeat.location.city
    || heartbeat.location.region
    || heartbeat.location.country
    || '未知地区';
}

export function aggregateSubscriptionAccessLogs(
  rows: AccessLogRow[],
  options: { now: Date; rangeDays: 1 | 7 | 30; heartbeatWindowDays?: HeartbeatWindowDays; truncated?: boolean },
): SubscriptionAnalyticsResult {
  const nowMs = options.now.getTime();
  const windowStart = new Date(nowMs - options.rangeDays * 24 * 60 * 60 * 1000);
  // 心跳条历史可独立于统计窗口拉长（如 14 天）：只影响 recentHeartbeats，不改变其他统计口径
  const heartbeatStartMs = options.heartbeatWindowDays
    ? nowMs - options.heartbeatWindowDays * 24 * 60 * 60 * 1000
    : windowStart.getTime();
  const heartbeatLimit = options.heartbeatWindowDays ? EXTENDED_HEARTBEAT_LIMIT : DEFAULT_HEARTBEAT_LIMIT;
  const grouped = new Map<string, Map<string, {
    timestamps: number[];
    /** 心跳条历史（可能早于统计窗口），仅用于 recentHeartbeats */
    history: number[];
    location: SubscriptionIpHeartbeat['location'];
    userAgent: string;
  }>>();

  for (const row of rows) {
    if (!row.userId || !row.meta || typeof row.meta !== 'object') continue;
    const headers = row.meta.headers;
    if (!headers || typeof headers !== 'object' || Array.isArray(headers)) continue;

    const ip = getRequestIp(headers as HeaderBag);
    const timestamp = Date.parse(row.createdAt);
    if (!ip || !Number.isFinite(timestamp)) continue;
    const inWindow = timestamp >= windowStart.getTime();
    // 既不在统计窗口也不在心跳窗口内的记录直接跳过
    if (!inWindow && timestamp < heartbeatStartMs) continue;

    const userIps = grouped.get(row.userId) ?? new Map();
    const userAgent = textHeader(headers as HeaderBag, 'user-agent') ?? '';
    const existing = userIps.get(ip) ?? {
      timestamps: [],
      history: [],
      userAgent,
      location: {
        city: decodedHeader(headers as HeaderBag, 'x-vercel-ip-city'),
        region: decodedHeader(headers as HeaderBag, 'x-vercel-ip-country-region'),
        country: decodedHeader(headers as HeaderBag, 'x-vercel-ip-country'),
        continent: decodedHeader(headers as HeaderBag, 'x-vercel-ip-continent'),
      },
    };
    userIps.set(ip, existing);
    grouped.set(row.userId, userIps);
    if (timestamp >= heartbeatStartMs) existing.history.push(timestamp);
    // 统计窗口外的更早日志只补充心跳历史，不进入任何统计
    if (!inWindow) continue;
    existing.timestamps.push(timestamp);
    if (userAgent) existing.userAgent = userAgent;
  }

  const users: SubscriptionUserActivity[] = [...grouped.entries()].map(([userId, ipMap]) => {
    const ips = [...ipMap.entries()]
      .filter(([, value]) => value.timestamps.length > 0) // 只有更早日志的 IP 不进入统计
      .map(([ip, value]): SubscriptionIpHeartbeat => {
      const timestamps = [...value.timestamps].sort((a, b) => b - a);
      const lastSeenMs = timestamps[0];
      return {
        ip,
        status: getStatus(lastSeenMs, nowMs),
        firstSeen: new Date(timestamps[timestamps.length - 1]).toISOString(),
        lastSeen: new Date(lastSeenMs).toISOString(),
        requestCount: timestamps.length,
        last24hRequests: timestamps.filter((item) => nowMs - item <= RECENT_WINDOW_MS).length,
        medianIntervalMinutes: medianIntervalMinutes(timestamps),
        location: value.location,
        userAgent: value.userAgent,
        clientName: getClientName(value.userAgent),
        recentHeartbeats: [...value.history].sort((a, b) => b - a).slice(0, heartbeatLimit).map((item) => new Date(item).toISOString()),
      };
    }).sort((a, b) => Date.parse(b.lastSeen) - Date.parse(a.lastSeen));

    return {
      userId,
      requestCount: ips.reduce((sum, item) => sum + item.requestCount, 0),
      uniqueIps: ips.length,
      activeIps: ips.filter((item) => item.status === 'online').length,
      recentIps: ips.filter((item) => item.status !== 'stale').length,
      lastSeen: ips[0]?.lastSeen ?? windowStart.toISOString(),
      locations: rankedCounts(ips.map(locationName)),
      clients: rankedCounts(ips.map((item) => item.clientName)),
      ips,
    };
  }).filter((user) => user.ips.length > 0) // 只有更早日志的用户不进入统计
    .sort((a, b) => Date.parse(b.lastSeen) - Date.parse(a.lastSeen));

  const allIps = new Set(users.flatMap((user) => user.ips.map((item) => item.ip)));
  return {
    generatedAt: options.now.toISOString(),
    windowStart: windowStart.toISOString(),
    rangeDays: options.rangeDays,
    truncated: Boolean(options.truncated),
    trend: buildTrend(rows, windowStart.getTime(), nowMs, options.rangeDays),
    totals: {
      users: users.length,
      uniqueIps: allIps.size,
      activeIps: users.reduce((sum, user) => sum + user.activeIps, 0),
      requests: users.reduce((sum, user) => sum + user.requestCount, 0),
    },
    users,
  };
}

export async function getSubscriptionAnalytics(
  db: DbInstance,
  options: { rangeDays: 1 | 7 | 30; heartbeatWindowDays?: HeartbeatWindowDays; now?: Date },
) {
  const now = options.now ?? new Date();
  const windowStartMs = now.getTime() - options.rangeDays * 24 * 60 * 60 * 1000;
  // 心跳窗口可能比统计窗口更早（如统计 7 天 + 心跳 14 天），取更早者作为查询起点
  const heartbeatStartMs = options.heartbeatWindowDays
    ? now.getTime() - options.heartbeatWindowDays * 24 * 60 * 60 * 1000
    : windowStartMs;
  const fetchStart = new Date(Math.min(windowStartMs, heartbeatStartMs));
  await cleanupSubscriptionAnalytics(db);
  const result = await db.$client.execute({
    sql: `SELECT user_id, headers, created_at FROM subscription_access
      WHERE created_at >= ? ORDER BY created_at DESC LIMIT ?`,
    args: [fetchStart.toISOString(), MAX_ACCESS_LOGS + 1],
  });
  const rows: AccessLogRow[] = result.rows.map((row) => ({
    userId: row.user_id === null ? null : String(row.user_id),
    meta: { headers: JSON.parse(String(row.headers)) },
    createdAt: String(row.created_at),
  }));

  return aggregateSubscriptionAccessLogs(rows.slice(0, MAX_ACCESS_LOGS), {
    now,
    rangeDays: options.rangeDays,
    truncated: rows.length > MAX_ACCESS_LOGS,
  });
}

