'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  Globe2,
  Laptop,
  Loader2,
  MapPin,
  Radio,
  RefreshCw,
  Search,
  UsersRound,
  Wifi,
} from 'lucide-react';

import { NavigationBar } from '@/components/NavigationBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageTitle } from '@/hooks/usePageTitle';
import { cn } from '@/lib/utils';
import { subscriptionAnalyticsApi } from '@/services/subscription-analytics-api';
import type {
  SubscriptionAnalyticsResult,
  SubscriptionIpHeartbeat,
  SubscriptionUserActivity,
} from '@/types/subscription-analytics';

const RANGE_OPTIONS = [
  { value: 1 as const, label: '24 小时' },
  { value: 7 as const, label: '7 天' },
  { value: 30 as const, label: '30 天' },
];

const STATUS_META = {
  online: { label: '活跃', dot: 'bg-primary', badge: 'bg-accent text-accent-foreground' },
  recent: { label: '今日访问', dot: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  stale: { label: '已离线', dot: 'bg-slate-300 dark:bg-slate-600', badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' },
};

function relativeTime(value: string) {
  const elapsed = Math.max(0, Date.now() - Date.parse(value));
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

function exactTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function intervalLabel(minutes: number | null) {
  if (!minutes) return '仅记录到一次';
  if (minutes < 120) return `约每 ${minutes} 分钟请求`;
  const hours = Math.round(minutes / 60);
  if (hours < 36) return `约每 ${hours} 小时请求`;
  const days = Math.round(hours / 24);
  return `约每 ${days} 天请求`;
}

function locationLabel(ip: SubscriptionIpHeartbeat) {
  const parts = [ip.location.country, ip.location.region, ip.location.city].filter(Boolean);
  return parts.length > 0 ? [...new Set(parts)].join(' · ') : '未知地区';
}

function Metric({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="min-w-0 px-5 py-4 first:pl-0 last:pr-0">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{value.toLocaleString()}</span>
        <span className="truncate text-xs text-muted-foreground">{hint}</span>
      </div>
    </div>
  );
}

/** 侧栏订阅行骨架：状态点 + 名称/时间行 + IP/请求数行，对齐 UserRow。 */
function UserRowSkeleton() {
  return (
    <div className="border-b border-border/50 px-4 py-3.5 last:border-b-0" aria-hidden>
      <div className="flex items-center gap-3">
        <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-14" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-4 w-4 shrink-0" />
      </div>
    </div>
  );
}

/** 详情面板骨架：头部统计 + 分布条形 + IP 心跳行（含 24 格心跳条），对齐 SelectedUserPanel。 */
function PanelSkeleton() {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card" aria-hidden>
      <div className="border-b border-border/60 px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2.5">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex gap-5">
            <Skeleton className="h-10 w-14" />
            <Skeleton className="h-10 w-14" />
          </div>
        </div>
      </div>
      <div className="grid gap-7 border-b border-border/60 bg-muted/20 px-5 py-5 sm:grid-cols-2 sm:px-6">
        {[0, 1].map((column) => (
          <div key={column}>
            <Skeleton className="h-3 w-24" />
            <div className="mt-3 space-y-2.5">
              {[0, 1, 2].map((row) => (
                <div key={row} className="grid grid-cols-[minmax(90px,1fr)_2fr_28px] items-center gap-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                  <Skeleton className="h-3 w-5 justify-self-end" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {[0, 1, 2].map((row) => (
        <div key={row} className="grid gap-4 border-b border-border/50 px-5 py-4 last:border-b-0 lg:grid-cols-[minmax(200px,0.9fr)_minmax(260px,1.5fr)_130px_110px] lg:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-10 rounded-full" />
            </div>
            <Skeleton className="ml-5 h-3 w-36" />
            <Skeleton className="ml-5 h-3 w-24" />
          </div>
          <div className="grid grid-cols-[repeat(24,minmax(3px,1fr))] gap-0.5">
            {Array.from({ length: 24 }, (_, index) => (
              <Skeleton key={index} className="h-6 rounded-[2px]" style={{ opacity: 0.35 + ((index * 7 + row * 3) % 5) * 0.1 }} />
            ))}
          </div>
          <div className="space-y-2 lg:mx-auto">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="space-y-2 lg:ml-auto">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function UserRow({
  user,
  selected,
  onSelect,
}: {
  user: SubscriptionUserActivity;
  selected: boolean;
  onSelect: () => void;
}) {  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group w-full border-b border-border/50 px-4 py-3.5 text-left transition-colors last:border-b-0',
        selected ? 'bg-primary/[0.07]' : 'hover:bg-muted/50',
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn(
          'h-2.5 w-2.5 shrink-0 rounded-full',
          user.activeIps > 0 ? 'bg-primary' : user.recentIps > 0 ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600',
        )} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-semibold">{user.userId}</span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{relativeTime(user.lastSeen)}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{user.uniqueIps} 个 IP</span>
            <span>{user.requestCount.toLocaleString()} 次请求</span>
          </div>
        </div>
        <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform', selected && 'translate-x-0.5 text-primary')} />
      </div>
    </button>
  );
}

function Distribution({ title, items }: { title: string; items: Array<{ name: string; count: number }> }) {
  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</h3>
      <div className="mt-3 space-y-2.5">
        {items.slice(0, 5).map((item) => (
          <div key={item.name} className="grid grid-cols-[minmax(90px,1fr)_2fr_28px] items-center gap-3 text-xs">
            <span className="truncate font-medium" title={item.name}>{item.name}</span>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }}
              />
            </div>
            <span className="text-right tabular-nums text-muted-foreground">{item.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HeartbeatStrip({
  timestamps,
  windowStart,
  windowEnd,
  rangeDays,
}: {
  timestamps: string[];
  windowStart: string;
  windowEnd: string;
  rangeDays: 1 | 7 | 30;
}) {
  const bins = 24;
  const startMs = Date.parse(windowStart);
  const endMs = Date.parse(windowEnd);
  const duration = Math.max(1, endMs - startMs);
  const counts = Array.from({ length: bins }, () => 0);

  for (const timestamp of timestamps) {
    const ratio = (Date.parse(timestamp) - startMs) / duration;
    const index = Math.min(bins - 1, Math.max(0, Math.floor(ratio * bins)));
    counts[index] += 1;
  }

  const max = Math.max(...counts, 1);
  const bucketHours = rangeDays === 1 ? 1 : rangeDays === 7 ? 7 : 30;

  return (
    <div>
      <div className="grid grid-cols-[repeat(24,minmax(3px,1fr))] gap-0.5" aria-label="心跳时间分布">
        {counts.map((count, index) => {
          const opacity = count === 0 ? 0 : 0.25 + (count / max) * 0.75;
          const bucketStart = new Date(startMs + (duration / bins) * index);
          return (
            <span
              key={index}
              className={cn(
                'h-6 rounded-[2px]',
                count === 0 ? 'bg-muted' : 'bg-primary',
              )}
              style={count === 0 ? undefined : { opacity }}
              title={`${exactTime(bucketStart.toISOString())} 起 ${bucketHours} 小时：${count} 次心跳`}
            />
          );
        })}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{rangeDays === 1 ? '24 小时前' : `${rangeDays} 天前`}</span>
        <span>色块越深，心跳越密</span>
        <span>现在</span>
      </div>
    </div>
  );
}

function IpHeartbeatRow({
  heartbeat,
  windowStart,
  generatedAt,
  rangeDays,
}: {
  heartbeat: SubscriptionIpHeartbeat;
  windowStart: string;
  generatedAt: string;
  rangeDays: 1 | 7 | 30;
}) {
  const status = STATUS_META[heartbeat.status];
  return (
    <div className="grid gap-4 border-b border-border/50 px-5 py-4 last:border-b-0 lg:grid-cols-[minmax(200px,0.9fr)_minmax(260px,1.5fr)_130px_110px] lg:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {heartbeat.status === 'online' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />}
            <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', status.dot)} />
          </span>
          <span className="truncate font-mono text-sm font-semibold" title={heartbeat.ip}>{heartbeat.ip}</span>
          <Badge className={cn('border-0 px-2 py-0.5 text-[10px] font-medium shadow-none', status.badge)}>{status.label}</Badge>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 pl-5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate" title={locationLabel(heartbeat)}>{locationLabel(heartbeat)}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 pl-5 text-xs text-muted-foreground">
          <Laptop className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate" title={heartbeat.userAgent}>{heartbeat.clientName}</span>
        </div>
      </div>

      <div className="min-w-0">
        <HeartbeatStrip
          timestamps={heartbeat.recentHeartbeats}
          windowStart={windowStart}
          windowEnd={generatedAt}
          rangeDays={rangeDays}
        />
      </div>

      <div className="lg:text-center">
        <div className="flex items-center gap-1.5 text-sm font-semibold lg:justify-center">
          <Radio className="h-3.5 w-3.5 text-muted-foreground" />
          {heartbeat.requestCount.toLocaleString()} 次
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{intervalLabel(heartbeat.medianIntervalMinutes)}</div>
      </div>

      <div className="lg:text-right">
        <div className="text-sm font-semibold">{relativeTime(heartbeat.lastSeen)}</div>
        <div className="mt-1 text-xs tabular-nums text-muted-foreground">{exactTime(heartbeat.lastSeen)}</div>
      </div>
    </div>
  );
}

function SelectedUserPanel({
  user,
  windowStart,
  generatedAt,
  rangeDays,
}: {
  user: SubscriptionUserActivity;
  windowStart: string;
  generatedAt: string;
  rangeDays: 1 | 7 | 30;
}) {
  // IP 行排序：最后心跳 / 请求频率 / 请求间隔，点击表头切换。
  type IpSortKey = 'lastSeen' | 'requests' | 'interval';
  const [ipSort, setIpSort] = useState<{ key: IpSortKey; dir: 'asc' | 'desc' }>({ key: 'lastSeen', dir: 'desc' });

  const sortedIps = useMemo(() => {
    const valueOf = (heartbeat: SubscriptionIpHeartbeat) => {
      if (ipSort.key === 'requests') return heartbeat.requestCount;
      if (ipSort.key === 'interval') return heartbeat.medianIntervalMinutes ?? Number.POSITIVE_INFINITY;
      return Date.parse(heartbeat.lastSeen);
    };
    return [...user.ips].sort((a, b) => {
      const cmp = valueOf(a) - valueOf(b);
      return ipSort.dir === 'asc' ? cmp : -cmp;
    });
  }, [user.ips, ipSort]);

  const toggleIpSort = (key: IpSortKey) => {
    setIpSort((current) => current.key === key
      ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: key === 'interval' ? 'asc' : 'desc' });
  };

  const IpSortHeader = ({ label, sortKey, className }: { label: string; sortKey: IpSortKey; className?: string }) => {
    const active = ipSort.key === sortKey;
    return (
      <button
        type="button"
        onClick={() => toggleIpSort(sortKey)}
        className={cn('inline-flex items-center gap-1 transition-colors hover:text-foreground', active ? 'text-foreground' : '', className)}
      >
        {label}
        {active
          ? (ipSort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)
          : <ArrowUpDown className="h-3 w-3 opacity-40" />}
      </button>
    );
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="border-b border-border/60 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">{user.userId}</h2>
              {user.activeIps > 0 && (
                <Badge className="border-0 bg-accent text-accent-foreground shadow-none">
                  {user.activeIps} 个 IP 活跃
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              最近访问 {relativeTime(user.lastSeen)}，所选时段共 {user.requestCount.toLocaleString()} 次订阅请求
            </p>
          </div>
          <div className="flex gap-5 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">唯一 IP</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">{user.uniqueIps}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">24h 内出现</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">{user.recentIps}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-7 border-b border-border/60 bg-muted/20 px-5 py-5 sm:grid-cols-2 sm:px-6">
        <Distribution title="IP 地区分布" items={user.locations} />
        <Distribution title="客户端分布" items={user.clients} />
      </div>

      <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-border/60 px-5 py-3 text-xs font-medium text-muted-foreground sm:px-6 lg:grid-cols-[minmax(200px,0.9fr)_minmax(260px,1.5fr)_130px_110px]">
        <span>IP / 地区 / 客户端</span>
        <span className="hidden lg:block">心跳连续性</span>
        <IpSortHeader label="频率" sortKey="requests" className="hidden lg:flex lg:justify-center" />
        <IpSortHeader label="最后心跳" sortKey="lastSeen" className="justify-self-end" />
      </div>
      <div>
        {sortedIps.map((heartbeat) => (
          <IpHeartbeatRow
            key={heartbeat.ip}
            heartbeat={heartbeat}
            windowStart={windowStart}
            generatedAt={generatedAt}
            rangeDays={rangeDays}
          />
        ))}
      </div>
    </div>
  );
}

export function SubscriptionAnalyticsClient({ superToken }: { superToken: string }) {
  usePageTitle('订阅使用分析');
  const [rangeDays, setRangeDays] = useState<1 | 7 | 30>(1);
  const [data, setData] = useState<SubscriptionAnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [userSort, setUserSort] = useState<'recent' | 'requests' | 'ips'>('recent');
  const [selectedUserId, setSelectedUserId] = useState('sw-big');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await subscriptionAnalyticsApi.get({ superToken, days: rangeDays });
      if (response.code !== 0) throw new Error(response.msg || '加载失败');
      setData(response.data);
      setSelectedUserId((current) => {
        if (response.data.users.some((user) => user.userId === current)) return current;
        return response.data.users.find((user) => user.userId === 'sw-big')?.userId
          ?? response.data.users[0]?.userId
          ?? '';
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '加载订阅分析失败');
    } finally {
      setLoading(false);
    }
  }, [rangeDays, superToken]);

  useEffect(() => { load(); }, [load]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filtered = !data ? [] : keyword
      ? data.users.filter((user) => user.userId.toLowerCase().includes(keyword))
      : [...data.users];
    if (userSort === 'requests') filtered.sort((a, b) => b.requestCount - a.requestCount);
    else if (userSort === 'ips') filtered.sort((a, b) => b.activeIps - a.activeIps || b.uniqueIps - a.uniqueIps);
    else filtered.sort((a, b) => Date.parse(b.lastSeen) - Date.parse(a.lastSeen));
    return filtered;
  }, [data, search, userSort]);

  const selectedUser = data?.users.find((user) => user.userId === selectedUserId) ?? filteredUsers[0];

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-zinc-950">
      <NavigationBar superToken={superToken} currentPage="analytics" />

      <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <Activity className="h-4 w-4" />
              Subscription pulse
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">订阅使用分析</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              从访问日志查看每个订阅背后的 IP 心跳、地区和客户端，快速找出仍在使用的设备。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-border bg-card p-1">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRangeDays(option.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    rangeDays === option.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-9 bg-card">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              刷新
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            <CircleAlert className="h-4 w-4" />
            {error}
          </div>
        )}

        <section className="mt-7 border-y border-border/70">
          <div className="grid divide-y divide-border/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            <Metric label="有访问的订阅" value={data?.totals.users ?? 0} hint="个用户" />
            <Metric label="唯一请求 IP" value={data?.totals.uniqueIps ?? 0} hint="不等于人数" />
            <Metric label="当前活跃 IP" value={data?.totals.activeIps ?? 0} hint="1 小时内" />
            <Metric label="订阅心跳" value={data?.totals.requests ?? 0} hint={`近 ${rangeDays === 1 ? '24 小时' : `${rangeDays} 天`}`} />
          </div>
        </section>

        <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>唯一 IP 只能用来判断使用迹象，不代表真实人数；移动网络、代理出口和 IPv6 隐私地址都可能让同一设备出现多个 IP。</span>
        </div>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[310px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-2xl border border-border/70 bg-card lg:sticky lg:top-24">
            <div className="border-b border-border/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <UsersRound className="h-4 w-4 text-primary" />
                  订阅列表
                </div>
                <span className="text-xs text-muted-foreground">{filteredUsers.length} 个</span>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="搜索用户 ID"
                  className="h-9 bg-muted/40 pl-9"
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">排序</span>
                <Select value={userSort} onValueChange={(value) => setUserSort(value as typeof userSort)}>
                  <SelectTrigger className="h-8 w-36 bg-muted/40 text-xs shadow-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">最近活跃</SelectItem>
                    <SelectItem value="requests">请求最多</SelectItem>
                    <SelectItem value="ips">活跃 IP 最多</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
              {loading && !data ? (
                <div aria-label="正在加载订阅列表">
                  {Array.from({ length: 6 }, (_, index) => <UserRowSkeleton key={index} />)}
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <UserRow
                    key={user.userId}
                    user={user}
                    selected={user.userId === selectedUser?.userId}
                    onSelect={() => setSelectedUserId(user.userId)}
                  />
                ))
              ) : (
                <div className="px-5 py-12 text-center text-sm text-muted-foreground">没有匹配的订阅</div>
              )}
            </div>
          </aside>

          {loading && !data ? (
            <PanelSkeleton />
          ) : selectedUser ? (
            <SelectedUserPanel
              user={selectedUser}
              windowStart={data?.windowStart ?? new Date().toISOString()}
              generatedAt={data?.generatedAt ?? new Date().toISOString()}
              rangeDays={data?.rangeDays ?? rangeDays}
            />
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 text-center">
              <Globe2 className="h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">所选时段没有订阅访问记录</p>
              <p className="mt-1 text-xs text-muted-foreground">切换到更长的时间范围再看看</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5" />活跃：1 小时内 · 今日访问：24 小时内</span>
          {data && <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />统计生成于 {exactTime(data.generatedAt)}</span>}
        </div>
      </main>
    </div>
  );
}

