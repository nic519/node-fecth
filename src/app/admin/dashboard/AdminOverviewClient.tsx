'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pulse as Activity,
  ArrowSquareOut,
  ArrowsClockwise,
  CalendarBlank,
  CaretRight,
  ChartLine,
  CheckCircle,
  Copy,
  FileText,
  GlobeHemisphereWest,
  Heartbeat,
  Info,
  LinkSimple,
  MagnifyingGlass,
  MapPin,
  Monitor,
  Scroll,
  UserCircle,
  UsersThree,
  WarningCircle,
} from '@phosphor-icons/react';

import { NavigationBar } from '@/components/NavigationBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageTitle } from '@/hooks/usePageTitle';
import { cn } from '@/lib/utils';
import type { SubscriptionStat, UserAdminConfig } from '@/modules/user/admin.schema';
import { adminService } from '@/services/admin-api';
import { logApi } from '@/services/log-api';
import { subscriptionAnalyticsApi } from '@/services/subscription-analytics-api';
import { templateService } from '@/services/template-api';
import type { LogEvent } from '@/types/log';
import type { SubscriptionAnalyticsResult, SubscriptionIpHeartbeat } from '@/types/subscription-analytics';
import { copyToClipboard } from '@/utils/configUtils';
import { formatDateTime, formatTraffic, parseTrafficInfo, type ParsedTrafficInfo } from '@/utils/trafficUtils';
import { isExpiringTraffic, isTightTraffic } from '@/app/admin/users/utils/userUtils';
import { LogDetailsDialog } from './components/LogDetailsDialog';
import { TrafficTrendChart } from './components/TrafficTrendChart';

const RANGE_OPTIONS = [
  { value: 1 as const, label: '24 小时' },
  { value: 7 as const, label: '7 天' },
  { value: 30 as const, label: '30 天' },
];

type SourceReference = { uid: string; name: string; stat: SubscriptionStat };
type SourceAggregate = { url: string; names: string[]; references: SourceReference[] };

function sourceName(source: SourceAggregate) {
  return source.names.length > 0 ? source.names.join(' / ') : '未命名订阅源';
}

function sourceHost(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname === '/' ? '' : parsed.pathname}`;
  } catch {
    return url;
  }
}

function latestReference(source: SourceAggregate) {
  return [...source.references].sort((a, b) => Date.parse(b.stat.lastUpdated ?? '') - Date.parse(a.stat.lastUpdated ?? ''))[0];
}

function trafficOf(source: SourceAggregate): ParsedTrafficInfo | null {
  const withTraffic = [...source.references]
    .filter((reference) => reference.stat.traffic)
    .sort((a, b) => Date.parse(b.stat.lastUpdated ?? '') - Date.parse(a.stat.lastUpdated ?? ''));
  return withTraffic.length ? parseTrafficInfo(withTraffic[0].stat.traffic) : null;
}

function exactTime(value?: string) {
  if (!value) return '暂无记录';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value));
}

function relativeTime(value?: string) {
  if (!value) return '暂无心跳';
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60_000));
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`;
  return `${Math.floor(minutes / 1440)} 天前`;
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function HeartbeatStrip({ heartbeat, start, end }: { heartbeat: SubscriptionIpHeartbeat; start: string; end: string }) {
  const bins = 24;
  const startMs = Date.parse(start);
  const duration = Math.max(1, Date.parse(end) - startMs);
  const counts = Array.from({ length: bins }, () => 0);
  heartbeat.recentHeartbeats.forEach((timestamp) => {
    const index = Math.min(bins - 1, Math.max(0, Math.floor(((Date.parse(timestamp) - startMs) / duration) * bins)));
    counts[index] += 1;
  });
  const max = Math.max(...counts, 1);
  return (
    <div className="min-w-0 flex-1">
      <div className="grid h-7 grid-cols-[repeat(24,minmax(2px,1fr))] items-end gap-[3px]" aria-label={`${heartbeat.ip} 的连续心跳分布`}>
        {counts.map((count, index) => (
          <span
            key={index}
            className={cn('h-7 rounded-[2px]', count ? 'bg-primary' : 'bg-secondary/80')}
            style={count ? { opacity: 0.3 + (count / max) * 0.7 } : undefined}
            title={`${count} 次心跳`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>时段开始</span><span>现在</span></div>
    </div>
  );
}

function TrafficBlock({ source, compact = false }: { source: SourceAggregate; compact?: boolean }) {
  const traffic = trafficOf(source);
  const latest = latestReference(source);
  if (!traffic) {
    return <div className="rounded-[10px] bg-secondary/55 px-3 py-2 text-xs text-muted-foreground">该源暂未上报流量快照{latest?.stat.lastUpdated ? ` · 更新于 ${exactTime(latest.stat.lastUpdated)}` : ''}</div>;
  }
  const percent = Math.min(100, Math.max(0, traffic.usagePercent));
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="text-sm"><span className="text-muted-foreground">剩余 </span><strong className="text-lg font-semibold tabular-nums tracking-[-0.02em]">{formatTraffic(traffic.remaining)}</strong></div>
        <span className="text-xs tabular-nums text-muted-foreground">已用 {formatTraffic(traffic.used)} / {formatTraffic(traffic.total)}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className={cn('h-full rounded-full', percent >= 90 ? 'bg-amber-500' : 'bg-primary')} style={{ width: `${percent}%` }} />
      </div>
      {!compact && <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>已使用 {traffic.usagePercent.toFixed(2)}%</span><span>{traffic.expire ? `${traffic.isExpired ? '已于 ' : '到期 '}${new Date(traffic.expire * 1000).toLocaleDateString('zh-CN')}` : '未提供到期时间'}</span></div>}
    </div>
  );
}

function Metric({ icon: Icon, label, value, note, href }: { icon: React.ElementType; label: string; value: number | string; note: string; href?: string }) {
  const content = (
    <div className="group flex min-w-0 items-center gap-3 px-1 py-4 sm:px-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground"><Icon weight="fill" className="h-5 w-5" /></span>
      <div className="min-w-0"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-0.5 flex items-baseline gap-2"><strong className="text-2xl font-semibold tabular-nums tracking-[-0.04em]">{value}</strong><span className="truncate text-[11px] text-muted-foreground">{note}</span></div></div>
      {href && <CaretRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function ExpiryCalendar({ sources, onSelect }: { sources: SourceAggregate[]; onSelect: (source: SourceAggregate) => void }) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const events = useMemo(() => sources.flatMap((source) => {
    const traffic = trafficOf(source);
    if (!traffic?.expire) return [];
    return [{ source, date: new Date(traffic.expire * 1000), expired: traffic.isExpired }];
  }), [sources]);
  const activeEvents = events.filter((event) => !event.expired);
  const months = [0, 1].map((offset) => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + offset, 1);
  });
  const selectedEvents = selectedDay ? events.filter((event) => dayKey(event.date) === selectedDay) : [];

  return (
    <section className="surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4"><div><h2 className="flex items-center gap-2 text-[15px] font-semibold"><CalendarBlank weight="fill" className="h-[18px] w-[18px] text-primary" />到期日历</h2><p className="mt-1 text-xs text-muted-foreground">当前月与下个月 · 点击日期查看全部关联源</p></div><Badge variant="secondary">{activeEvents.length} 项</Badge></div>
      <div className="grid gap-5 p-5 xl:grid-cols-2">
        {months.map((month) => {
          const year = month.getFullYear();
          const monthIndex = month.getMonth();
          const count = new Date(year, monthIndex + 1, 0).getDate();
          const leading = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
          return (
            <div key={`${year}-${monthIndex}`} className="min-w-0">
              <h3 className="mb-3 text-center text-sm font-medium">{year} 年 {monthIndex + 1} 月</h3>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">{['一', '二', '三', '四', '五', '六', '日'].map((day) => <span key={day} className="pb-1">{day}</span>)}</div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: leading }, (_, index) => <span key={`blank-${index}`} />)}
                {Array.from({ length: count }, (_, index) => {
                  const date = new Date(year, monthIndex, index + 1);
                  const key = dayKey(date);
                  const dayEvents = events.filter((event) => dayKey(event.date) === key);
                  const isToday = key === dayKey(new Date());
                  return <button key={key} type="button" disabled={!dayEvents.length} onClick={() => setSelectedDay(key)} className={cn('relative min-h-12 rounded-[9px] text-xs tabular-nums transition-colors', dayEvents.length ? 'bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground' : 'text-muted-foreground/55', selectedDay === key && 'ring-2 ring-ring ring-offset-1', isToday && !selectedDay && 'ring-1 ring-foreground/25')} aria-label={`${key}，${dayEvents.length} 个订阅到期`}><span>{index + 1}</span>{dayEvents.length > 0 && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current" />}</button>;
                })}
              </div>
            </div>
          );
        })}
      </div>
      {selectedDay && <div className="border-t border-border/60 px-5 py-4"><div className="mb-3 flex items-center justify-between text-xs"><span className="font-medium">{selectedDay} · {selectedEvents.length} 个订阅</span><button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setSelectedDay(null)}>收起</button></div><div className="space-y-2">{selectedEvents.map(({ source }) => <button type="button" key={source.url} onClick={() => onSelect(source)} className="flex w-full items-center justify-between gap-3 rounded-[10px] bg-secondary/60 px-3 py-2.5 text-left hover:bg-secondary"><span className="min-w-0 truncate text-sm">{sourceName(source)}</span><span className="shrink-0 text-xs text-muted-foreground">{source.references.length} 个用户</span></button>)}</div></div>}
    </section>
  );
}

export function AdminOverviewClient({ superToken, initialUsers }: { superToken: string; initialUsers: UserAdminConfig[] }) {
  usePageTitle('运营总览');
  const [users, setUsers] = useState(initialUsers);
  const [templateCount, setTemplateCount] = useState(0);
  const [analytics, setAnalytics] = useState<SubscriptionAnalyticsResult | null>(null);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [rangeDays, setRangeDays] = useState<1 | 7 | 30>(7);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(() => initialUsers.find((user) => user.subscriptionStats?.some((stat) => stat.url))?.uid ?? initialUsers[0]?.uid ?? '');
  const [selectedSource, setSelectedSource] = useState<SourceAggregate | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogEvent | null>(null);
  const [logUser, setLogUser] = useState('');
  const [expiredOpen, setExpiredOpen] = useState(false);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const tokenQuery = `superToken=${encodeURIComponent(superToken)}`;

  const loadDirectory = useCallback(async () => {
    try {
      const [userResponse, templateResponse] = await Promise.all([adminService.getUsers(superToken), templateService.getTemplates(superToken)]);
      if (userResponse.code === 0) setUsers(userResponse.data.users);
      if (templateResponse.code === 0) setTemplateCount(templateResponse.data.templates.length);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : '用户或模板加载失败'); }
  }, [superToken]);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await subscriptionAnalyticsApi.get({ superToken, days: rangeDays });
      if (response.code !== 0) throw new Error(response.msg || '订阅分析加载失败');
      setAnalytics(response.data);
      setError('');
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : '订阅分析加载失败'); }
    finally { setLoading(false); }
  }, [rangeDays, superToken]);

  const loadLogs = useCallback(async () => {
    try {
      const response = await logApi.getLogs({ superToken, page: 1, pageSize: 8, userId: logUser || undefined });
      if (response.code === 0) setLogs(response.data.data);
    } catch { setError('日志加载失败，请刷新重试'); }
    finally { setLogsLoaded(true); }
  }, [logUser, superToken]);

  useEffect(() => { void loadDirectory(); }, [loadDirectory]);
  useEffect(() => { void loadAnalytics(); }, [loadAnalytics]);
  useEffect(() => { void loadLogs(); }, [loadLogs]);

  const sources = useMemo(() => {
    const merged = new Map<string, SourceAggregate>();
    users.forEach((user) => (user.subscriptionStats ?? []).forEach((stat) => {
      if (!stat.url) return;
      const existing = merged.get(stat.url) ?? { url: stat.url, names: [], references: [] };
      const name = stat.name?.trim();
      if (name && !existing.names.includes(name)) existing.names.push(name);
      existing.references.push({ uid: user.uid, name: name || '订阅源', stat });
      merged.set(stat.url, existing);
    }));
    return [...merged.values()].sort((a, b) => a.url.localeCompare(b.url));
  }, [users]);

  const filteredUsers = useMemo(() => users.filter((user) => user.uid.toLowerCase().includes(search.trim().toLowerCase())), [search, users]);
  const effectiveUserId = filteredUsers.some((user) => user.uid === selectedUserId) ? selectedUserId : filteredUsers[0]?.uid ?? '';
  const selectedUser = users.find((user) => user.uid === effectiveUserId);
  const selectedActivity = analytics?.users.find((user) => user.userId === effectiveUserId);
  const selectedSources = sources.filter((source) => source.references.some((reference) => reference.uid === effectiveUserId));
  const activeIps = analytics?.totals.activeIps ?? 0;
  const expiringCount = sources.filter((source) => {
    const traffic = trafficOf(source);
    return traffic?.expire && !traffic.isExpired && traffic.expire * 1000 < Date.now() + 30 * 86400_000;
  }).length;

  // 待处理队列：流量紧张优先，其次 7 天内到期；已过期源进右侧收纳，不占队列。
  const attentionSources = useMemo(() => sources
    .map((source) => ({ source, traffic: trafficOf(source) }))
    .filter((entry): entry is { source: SourceAggregate; traffic: ParsedTrafficInfo } => Boolean(entry.traffic && !entry.traffic.isExpired))
    .filter((entry) => isTightTraffic(entry.traffic) || isExpiringTraffic(entry.traffic))
    .sort((a, b) => {
      const rank = (entry: { traffic: ParsedTrafficInfo }) => (isTightTraffic(entry.traffic) ? 0 : 1);
      return rank(a) - rank(b) || a.traffic.remaining - b.traffic.remaining;
    }), [sources]);

  // 已过期收纳：按过期时间倒序，最新过期的排最前。
  const expiredSources = useMemo(() => sources
    .map((source) => ({ source, traffic: trafficOf(source) }))
    .filter((entry): entry is { source: SourceAggregate; traffic: ParsedTrafficInfo } => Boolean(entry.traffic?.isExpired))
    .sort((a, b) => (b.traffic.expire ?? 0) - (a.traffic.expire ?? 0)), [sources]);

  const refresh = async () => { await Promise.all([loadDirectory(), loadAnalytics(), loadLogs()]); };
  const copy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (!success) throw new Error('复制失败');
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="min-h-100dvh bg-background">
      <NavigationBar superToken={superToken} currentPage="dashboard" />
      <main className="content-container py-7 sm:py-9">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div><h1 className="text-[28px] font-semibold tracking-[-0.035em] sm:text-[32px]">运营总览</h1><p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">用户、共享订阅、流量、IP 心跳与日志在同一视图中联动。点击任一记录即可继续查看上下文。</p></div>
          <div className="flex flex-wrap items-center gap-2"><div className="flex rounded-[11px] bg-secondary p-1">{RANGE_OPTIONS.map((option) => <button type="button" key={option.value} onClick={() => setRangeDays(option.value)} className={cn('min-h-9 rounded-[8px] px-3 text-xs font-medium transition-colors', rangeDays === option.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{option.label}</button>)}</div><Button variant="outline" onClick={refresh} disabled={loading} className="h-11 bg-card"><ArrowsClockwise className={cn('h-4 w-4', loading && 'animate-spin')} />刷新</Button></div>
        </div>

        {error && <div role="alert" className="mt-5 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"><WarningCircle weight="fill" className="h-5 w-5" />{error}</div>}

        <section className="mt-7 grid divide-y divide-border/60 border-y border-border/70 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x">
          <Metric icon={UsersThree} label="用户" value={users.length} note="全部账户" href={`/admin/users?${tokenQuery}`} />
          <Metric icon={LinkSimple} label="独立订阅源" value={sources.length} note={`${sources.reduce((sum, source) => sum + source.references.length, 0)} 次引用`} href={`/admin/sources?${tokenQuery}`} />
          <Metric icon={Heartbeat} label="当前活跃 IP" value={activeIps} note={`${analytics?.totals.uniqueIps ?? 0} 个唯一 IP`} href={`/admin/analytics?${tokenQuery}`} />
          <Metric icon={CalendarBlank} label="30 天内到期" value={expiringCount} note="按去重订阅源" />
          <Metric icon={FileText} label="配置模板" value={templateCount} note="YAML 与可视化" href={`/admin/templates?${tokenQuery}`} />
        </section>

        <div className="mt-6 grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="surface overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-5 py-4 sm:px-6">
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold"><ChartLine weight="fill" className="h-[18px] w-[18px] text-primary" />访问趋势</h2>
                <p className="mt-1 text-xs text-muted-foreground">按{analytics?.trend.granularity === 'hour' ? '小时' : '天'}聚合订阅拉取次数与唯一 IP · 来自真实访问日志</p>
              </div>
              <span className="text-xs text-muted-foreground">{RANGE_OPTIONS.find((option) => option.value === rangeDays)?.label}</span>
            </div>
            <div className="px-3 py-4 sm:px-5">
              {!analytics && loading ? (
                <Skeleton className="h-60 w-full rounded-xl" aria-label="正在加载访问趋势" />
              ) : (
                <TrafficTrendChart points={analytics?.trend.points ?? []} granularity={analytics?.trend.granularity ?? 'day'} />
              )}
            </div>
          </section>

          <section className="surface flex flex-col overflow-hidden">
            <div className="border-b border-border/60 px-4 py-3.5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-500">
                <WarningCircle weight="fill" className="h-4 w-4" />
                待处理 {attentionSources.length} 项
              </h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">流量紧张优先，其次临近到期</p>
            </div>
            <div className="max-h-[232px] flex-1 overflow-y-auto p-2">
              {attentionSources.map(({ source, traffic }) => (
                <button
                  type="button"
                  key={source.url}
                  onClick={() => setSelectedSource(source)}
                  className="flex w-full min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-secondary/60"
                >
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', isTightTraffic(traffic) ? 'bg-red-500' : 'bg-amber-500')} />
                  <span className="min-w-0 flex-1 truncate text-sm">{sourceName(source)}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                    {isTightTraffic(traffic) ? `剩 ${formatTraffic(traffic.remaining)}` : `${new Date(traffic.expire! * 1000).toLocaleDateString('zh-CN')} 到期`}
                  </span>
                </button>
              ))}
              {!attentionSources.length && <div className="px-3 py-8 text-center text-xs text-muted-foreground">没有待处理项</div>}
            </div>
            {expiredSources.length > 0 && (
              <div className="mt-auto border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setExpiredOpen((open) => !open)}
                  className="flex min-h-11 w-full items-center gap-2 px-4 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <WarningCircle weight="fill" className="h-3.5 w-3.5 text-muted-foreground/70" />
                  已过期收纳（{expiredSources.length}）
                  <CaretRight className={cn('ml-auto h-3.5 w-3.5 transition-transform', expiredOpen && 'rotate-90')} />
                </button>
                {expiredOpen && (
                  <div className="max-h-40 overflow-y-auto border-t border-border/50 p-2">
                    {expiredSources.map(({ source, traffic }) => (
                      <button
                        type="button"
                        key={source.url}
                        onClick={() => setSelectedSource(source)}
                        className="flex w-full min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-secondary/60"
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
                        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{sourceName(source)}</span>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/80">
                          已于 {new Date(traffic.expire! * 1000).toLocaleDateString('zh-CN')} 过期
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="mt-7 grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="surface overflow-hidden xl:sticky xl:top-24">
            <div className="border-b border-border/60 p-4"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">用户与订阅</h2><span className="text-xs text-muted-foreground">{filteredUsers.length} / {users.length}</span></div><div className="relative"><MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索用户 ID" className="h-11 bg-secondary/50 pl-9 shadow-none" /></div></div>
            <div className="max-h-[680px] overflow-y-auto">
              {filteredUsers.map((user) => {
                const activity = analytics?.users.find((item) => item.userId === user.uid);
                const count = sources.filter((source) => source.references.some((reference) => reference.uid === user.uid)).length;
                const active = user.uid === effectiveUserId;
                return <button type="button" key={user.uid} onClick={() => setSelectedUserId(user.uid)} className={cn('flex min-h-[68px] w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-b-0', active ? 'bg-accent/75' : 'hover:bg-secondary/50')}><span className={cn('h-2 w-2 shrink-0 rounded-full', activity?.activeIps ? 'bg-primary' : 'bg-muted-foreground/30')} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{user.uid}</span><span className="mt-0.5 block text-xs text-muted-foreground">{count} 个订阅 · {activity ? relativeTime(activity.lastSeen) : '所选时段无访问'}</span></span><CaretRight className={cn('h-4 w-4 text-muted-foreground/45', active && 'text-primary')} /></button>;
              })}
              {!filteredUsers.length && <div className="p-10 text-center text-sm text-muted-foreground">没有匹配的用户</div>}
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            {selectedUser ? <section className="surface overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary"><UserCircle weight="fill" className="h-6 w-6 text-muted-foreground" /></span><div className="min-w-0"><h2 className="truncate text-xl font-semibold tracking-[-0.025em]">{selectedUser.uid}</h2><p className="mt-0.5 text-xs text-muted-foreground">配置更新于 {formatDateTime(selectedUser.updatedAt)}</p></div></div><div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={() => setLogUser(selectedUser.uid)}><Scroll className="h-4 w-4" />该用户日志</Button><Button asChild variant="outline" size="sm" className="bg-card"><Link href={`/config?uid=${encodeURIComponent(selectedUser.uid)}&token=${encodeURIComponent(selectedUser.accessToken)}`} target="_blank">打开用户配置<ArrowSquareOut className="h-4 w-4" /></Link></Button></div></div>
              <div className="grid divide-y divide-border/60 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:divide-x lg:divide-y-0">
                <div className="min-w-0 p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-semibold"><LinkSimple weight="fill" className="h-[18px] w-[18px] text-primary" />订阅用量 <span className="font-normal text-muted-foreground">{selectedSources.length}</span></h3><span className="text-[11px] text-muted-foreground">相同 URL 已跨用户合并</span></div><div className="space-y-5">{selectedSources.map((source) => <button type="button" key={source.url} onClick={() => setSelectedSource(source)} className="group block w-full text-left"><div className="mb-2 flex items-center gap-2"><span className="min-w-0 flex-1 truncate text-sm font-medium group-hover:text-primary">{sourceName(source)}</span><span className="shrink-0 text-[11px] text-muted-foreground">{source.references.length > 1 ? `共享给 ${source.references.length} 人` : sourceHost(source.url)}</span></div><TrafficBlock source={source} /></button>)}{!selectedSources.length && <div className="rounded-xl bg-secondary/45 p-6 text-center text-sm text-muted-foreground">暂无有流量快照的附加订阅</div>}</div></div>
                <div className="min-w-0 bg-secondary/20 p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-semibold"><Activity weight="fill" className="h-[18px] w-[18px] text-primary" />IP 与连续心跳</h3><span className="text-xs text-muted-foreground">{selectedActivity?.uniqueIps ?? 0} 个 IP</span></div>{!analytics && loading ? <div className="space-y-3" aria-label="正在加载心跳">{[0, 1].map((index) => <div key={index} className="rounded-xl bg-card/85 p-3.5"><div className="flex items-center gap-3"><Skeleton className="h-2 w-2 rounded-full" /><Skeleton className="h-4 w-28" /><Skeleton className="ml-auto h-3 w-14" /></div><div className="mt-2 flex gap-4"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-14" /></div><div className="mt-3 grid h-7 grid-cols-[repeat(24,minmax(2px,1fr))] items-end gap-[3px]">{Array.from({ length: 24 }, (_, cell) => <Skeleton key={cell} className="h-7 rounded-[2px]" style={{ opacity: 0.3 + ((cell * 5 + index * 3) % 4) * 0.12 }} />)}</div></div>)}</div> : selectedActivity?.ips.length ? <div className="space-y-3">{selectedActivity.ips.map((heartbeat) => <div key={heartbeat.ip} className="rounded-xl bg-card/85 p-3.5"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className={cn('h-2 w-2 rounded-full', heartbeat.status === 'online' ? 'bg-primary' : heartbeat.status === 'recent' ? 'bg-amber-500' : 'bg-muted-foreground/30')} /><span className="font-mono text-sm font-medium">{heartbeat.ip}</span><span className="ml-auto text-xs text-muted-foreground">{relativeTime(heartbeat.lastSeen)}</span></div><div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground"><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{[heartbeat.location.country, heartbeat.location.city].filter(Boolean).join(' · ') || '未知地区'}</span><span className="flex items-center gap-1"><Monitor className="h-3.5 w-3.5" />{heartbeat.clientName}</span><span>{heartbeat.requestCount} 次请求</span></div><div className="mt-3"><HeartbeatStrip heartbeat={heartbeat} start={analytics?.windowStart ?? ''} end={analytics?.generatedAt ?? ''} /></div></div>)}</div> : <div className="flex min-h-40 flex-col items-center justify-center text-center"><GlobeHemisphereWest className="h-8 w-8 text-muted-foreground/35" /><p className="mt-3 text-sm text-muted-foreground">所选时段没有访问心跳</p><button type="button" onClick={() => setRangeDays(30)} className="mt-2 text-xs text-primary hover:underline">切换到 30 天</button></div>}</div>
              </div>
            </section> : <section className="surface flex min-h-72 items-center justify-center text-sm text-muted-foreground">选择一位用户查看订阅与心跳</section>}

            <ExpiryCalendar sources={sources} onSelect={setSelectedSource} />

            <section className="surface overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4"><div><h2 className="flex items-center gap-2 text-[15px] font-semibold"><Scroll weight="fill" className="h-[18px] w-[18px] text-primary" />{logUser ? `${logUser} 的日志` : '最近日志'}</h2><p className="mt-1 text-xs text-muted-foreground">点击记录查看完整元数据</p></div><div className="flex items-center gap-2">{logUser && <Button variant="ghost" size="sm" onClick={() => setLogUser('')}>清除用户筛选</Button>}<Button asChild variant="ghost" size="sm"><Link href={`/admin/logs?${tokenQuery}`}>全部日志<CaretRight className="h-4 w-4" /></Link></Button></div></div><div>{!logsLoaded ? Array.from({ length: 4 }, (_, index) => <div key={index} className="grid min-h-[62px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/50 px-5 py-3 last:border-b-0" aria-hidden><Skeleton className="h-2 w-2 rounded-full" /><span className="min-w-0 space-y-1.5"><Skeleton className="block h-3.5 w-56" /><Skeleton className="block h-3 w-28" /></span><Skeleton className="h-3 w-12" /></div>) : <>{logs.map((log) => <button type="button" key={log.id} onClick={() => setSelectedLog(log)} className="grid min-h-[62px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/50 px-5 py-3 text-left last:border-b-0 hover:bg-secondary/40"><span className={cn('h-2 w-2 rounded-full', log.level === 'error' ? 'bg-red-500' : log.level === 'warn' ? 'bg-amber-500' : 'bg-primary')} /><span className="min-w-0"><span className="block truncate text-sm">{log.message}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{log.type}{log.userId ? ` · ${log.userId}` : ''}</span></span><span className="text-xs tabular-nums text-muted-foreground">{exactTime(log.createdAt)}</span></button>)}{!logs.length && <div className="p-8 text-center text-sm text-muted-foreground">当前筛选下暂无日志</div>}</>}</div></section>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>访问量表示订阅被客户端拉取的次数；唯一 IP 不等于真实人数。访问趋势按真实访问日志聚合；流量与到期时间来自订阅响应快照。</span></div>
      </main>

      <Sheet open={Boolean(selectedSource)} onOpenChange={(open) => { if (!open) setSelectedSource(null); }}>
        <SheetContent className="w-full overflow-y-auto border-border/70 p-0 sm:max-w-[560px]">
          {selectedSource && <><SheetHeader className="border-b border-border/60 px-6 py-6 pr-14"><SheetTitle className="text-xl tracking-[-0.025em]">{sourceName(selectedSource)}</SheetTitle><SheetDescription className="break-all text-left font-mono text-xs leading-5">{selectedSource.url}</SheetDescription></SheetHeader><div className="space-y-7 p-6"><section><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">当前流量快照</h3><Button variant="ghost" size="sm" onClick={() => void copy(selectedSource.url)}>{copied ? <CheckCircle weight="fill" className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}{copied ? '已复制' : '复制地址'}</Button></div><TrafficBlock source={selectedSource} /></section><section><h3 className="mb-3 text-sm font-semibold">全部引用用户（{selectedSource.references.length}）</h3><div className="space-y-2">{selectedSource.references.map((reference) => <button type="button" key={`${reference.uid}-${reference.name}`} onClick={() => { setSelectedUserId(reference.uid); setSelectedSource(null); }} className="flex w-full items-center gap-3 rounded-xl bg-secondary/55 px-4 py-3 text-left hover:bg-secondary"><UserCircle weight="fill" className="h-5 w-5 text-muted-foreground" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{reference.uid}</span><span className="block truncate text-xs text-muted-foreground">{reference.name} · 更新 {exactTime(reference.stat.lastUpdated)}</span></span><CaretRight className="h-4 w-4 text-muted-foreground" /></button>)}</div></section><section className="rounded-xl bg-secondary/45 p-4 text-xs leading-5 text-muted-foreground">同一 URL 只保留一个独立源，所有用户的引用均列在上方。选择用户会回到其用量和 IP 心跳，不需要离开总览。</section></div></>}
        </SheetContent>
      </Sheet>

      <LogDetailsDialog log={selectedLog} open={Boolean(selectedLog)} onOpenChange={(open) => { if (!open) setSelectedLog(null); }} onCopy={async (text) => { await copy(text); }} />
    </div>
  );
}
