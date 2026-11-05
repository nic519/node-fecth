'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowSquareOut,
  ArrowsClockwise,
  CaretRight,
  CheckCircle,
  Copy,
  LinkSimple,
  MagnifyingGlass,
  UserCircle,
  WarningCircle,
} from '@phosphor-icons/react';

import { NavigationBar } from '@/components/NavigationBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { usePageTitle } from '@/hooks/usePageTitle';
import { cn } from '@/lib/utils';
import type { SubscriptionStat } from '@/modules/user/admin.schema';
import { adminService } from '@/services/admin-api';
import { copyToClipboard } from '@/utils/configUtils';
import { formatTraffic, parseTrafficInfo, type ParsedTrafficInfo } from '@/utils/trafficUtils';
import { isExpiringTraffic, isTightTraffic } from '@/app/admin/users/utils/userUtils';

type SourceReference = { uid: string; name: string; stat: SubscriptionStat };
type SourceAggregate = { url: string; names: string[]; references: SourceReference[] };

type SourceScope = 'all' | 'tight' | 'expiring' | 'expired' | 'missing';
type SourceSort = 'attention' | 'remaining' | 'usage' | 'expiry';

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

function trafficOf(source: SourceAggregate): ParsedTrafficInfo | null {
  const withTraffic = [...source.references]
    .filter((reference) => reference.stat.traffic)
    .sort((a, b) => Date.parse(b.stat.lastUpdated ?? '') - Date.parse(a.stat.lastUpdated ?? ''));
  return withTraffic.length ? parseTrafficInfo(withTraffic[0].stat.traffic) : null;
}

function latestUpdated(source: SourceAggregate) {
  return source.references
    .map((reference) => reference.stat.lastUpdated)
    .filter(Boolean)
    .sort()
    .at(-1);
}

function exactTime(value?: string) {
  if (!value) return '暂无记录';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value));
}

function expireText(traffic: ParsedTrafficInfo | null) {
  if (!traffic?.expire) return '未提供';
  const date = new Date(traffic.expire * 1000);
  return `${date.toLocaleDateString('zh-CN')}${traffic.isExpired ? ' · 已过期' : ''}`;
}

function statusOf(source: SourceAggregate): { label: string; className: string } {
  const traffic = trafficOf(source);
  if (!traffic) return { label: '流量未提供', className: 'text-muted-foreground' };
  if (traffic.isExpired) return { label: '已过期', className: 'text-muted-foreground' };
  if (isTightTraffic(traffic)) return { label: '流量紧张', className: 'text-red-600 dark:text-red-500' };
  if (isExpiringTraffic(traffic)) return { label: '7 天内到期', className: 'text-amber-600 dark:text-amber-500' };
  return { label: '正常', className: 'text-primary' };
}

const attentionRank = (traffic: ParsedTrafficInfo | null) => {
  if (!traffic) return 2;
  if (traffic.isExpired) return 9;
  if (isTightTraffic(traffic)) return 0;
  if (isExpiringTraffic(traffic)) return 1;
  return 3;
};

export function SourcesClient({ superToken }: { superToken: string }) {
  usePageTitle('订阅源');
  const [users, setUsers] = useState<Awaited<ReturnType<typeof adminService.getUsers>>['data']['users']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<SourceScope>('all');
  const [sort, setSort] = useState<SourceSort>('attention');
  const [selectedSource, setSelectedSource] = useState<SourceAggregate | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await adminService.getUsers(superToken);
      if (response.code !== 0) throw new Error(response.msg || '用户列表加载失败');
      setUsers(response.data.users);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '用户列表加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 相同远程地址跨用户合并为一个独立源，别名与引用关系完整保留。
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
    return [...merged.values()];
  }, [users]);

  const result = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = sources.filter((source) => {
      if (term) {
        const haystack = [
          source.url,
          ...source.names,
          ...source.references.map((reference) => `${reference.uid} ${reference.name}`),
        ].join(' ').toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      const traffic = trafficOf(source);
      if (scope === 'tight') return isTightTraffic(traffic);
      if (scope === 'expiring') return isExpiringTraffic(traffic);
      if (scope === 'expired') return Boolean(traffic?.isExpired);
      if (scope === 'missing') return !traffic;
      return true;
    });
    return filtered.sort((a, b) => {
      const trafficA = trafficOf(a);
      const trafficB = trafficOf(b);
      if (sort === 'remaining') return (trafficA?.remaining ?? Infinity) - (trafficB?.remaining ?? Infinity);
      if (sort === 'usage') return (trafficB?.usagePercent ?? -1) - (trafficA?.usagePercent ?? -1);
      if (sort === 'expiry') return (trafficA?.expire ?? Infinity) - (trafficB?.expire ?? Infinity);
      return attentionRank(trafficA) - attentionRank(trafficB) || (trafficA?.remaining ?? Infinity) - (trafficB?.remaining ?? Infinity);
    });
  }, [sources, search, scope, sort]);

  const copy = async (text: string) => {
    if (!(await copyToClipboard(text))) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="min-h-100dvh bg-background">
      <NavigationBar superToken={superToken} currentPage="sources" />
      <main className="content-container py-7 sm:py-9">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[28px] font-semibold tracking-[-0.035em] sm:text-[32px]">订阅源</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
              {sources.length} 个独立源来自 {sources.reduce((sum, source) => sum + source.references.length, 0)} 次用户引用；相同远程地址已合并，未提供流量不视为 0。
            </p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading} className="h-11 bg-card">
            <ArrowsClockwise className={cn('h-4 w-4', loading && 'animate-spin')} />
            刷新
          </Button>
        </div>

        {error && <div role="alert" className="mt-5 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"><WarningCircle weight="fill" className="h-5 w-5" />{error}</div>}

        <section className="surface mt-7 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-5 py-4">
            <div className="relative min-w-56 flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="订阅源地址、别名或使用用户" className="h-10 bg-secondary/50 pl-9 shadow-none" />
            </div>
            <Select value={scope} onValueChange={(value) => setScope(value as SourceScope)}>
              <SelectTrigger className="h-10 w-36 bg-secondary/50 shadow-none"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="tight">流量紧张</SelectItem>
                <SelectItem value="expiring">7 天内到期</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
                <SelectItem value="missing">流量未提供</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(value) => setSort(value as SourceSort)}>
              <SelectTrigger className="h-10 w-40 bg-secondary/50 shadow-none"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="attention">异常优先</SelectItem>
                <SelectItem value="remaining">剩余从少到多</SelectItem>
                <SelectItem value="usage">使用率从高到低</SelectItem>
                <SelectItem value="expiry">到期从近到远</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">{result.length} / {sources.length} 个独立源</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">独立订阅源 / 使用用户</th>
                  <th className="px-3 py-3 font-medium">已用 / 总量</th>
                  <th className="px-3 py-3 font-medium">剩余</th>
                  <th className="px-3 py-3 font-medium">到期</th>
                  <th className="px-3 py-3 font-medium">流量更新</th>
                  <th className="px-3 py-3 font-medium">状态</th>
                  <th className="px-3 py-3"><span className="sr-only">详情</span></th>
                </tr>
              </thead>
              <tbody>
                {result.map((source) => {
                  const traffic = trafficOf(source);
                  const status = statusOf(source);
                  const percent = traffic ? Math.min(100, Math.max(0, traffic.usagePercent)) : 0;
                  return (
                    <tr
                      key={source.url}
                      tabIndex={0}
                      onClick={() => setSelectedSource(source)}
                      onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setSelectedSource(source); } }}
                      className="cursor-pointer border-b border-border/50 transition-colors last:border-b-0 hover:bg-secondary/40"
                    >
                      <td className="max-w-72 px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{sourceName(source)}</span>
                          {source.references.length > 1 && <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px] font-normal">共享 {source.references.length} 用户</Badge>}
                        </div>
                        <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground/80" title={source.url}>{sourceHost(source.url)}</div>
                        <div className="mt-0.5 truncate text-[11px] text-muted-foreground/70">{source.references.map((reference) => reference.uid).join('、')}</div>
                      </td>
                      <td className="min-w-44 px-3 py-3.5">
                        {traffic ? (
                          <div>
                            <div className="flex items-baseline justify-between gap-2 text-[11px] text-muted-foreground">
                              <span>{formatTraffic(traffic.used)} / {formatTraffic(traffic.total)}</span>
                              <span className="tabular-nums">{traffic.usagePercent.toFixed(1)}%</span>
                            </div>
                            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
                              <div className={cn('h-full rounded-full', percent >= 90 ? 'bg-amber-500' : 'bg-primary')} style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        ) : <span className="text-xs text-muted-foreground/70">—</span>}
                      </td>
                      <td className="px-3 py-3.5 tabular-nums">{traffic ? <strong>{formatTraffic(traffic.remaining)}</strong> : '—'}</td>
                      <td className="px-3 py-3.5 text-xs text-muted-foreground">{expireText(traffic)}</td>
                      <td className="px-3 py-3.5 text-xs tabular-nums text-muted-foreground">{exactTime(latestUpdated(source))}</td>
                      <td className="px-3 py-3.5"><span className={cn('text-xs font-medium', status.className)}>{status.label}</span></td>
                      <td className="px-3 py-3.5"><CaretRight className="h-4 w-4 text-muted-foreground/50" /></td>
                    </tr>
                  );
                })}
                {!result.length && (
                  <tr><td colSpan={7} className="px-5 py-14 text-center text-sm text-muted-foreground">
                    {loading ? '正在加载…' : '没有匹配的订阅源，调整搜索或状态筛选'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <LinkSimple className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>流量与到期时间来自订阅响应快照；同一 URL 只保留一个独立源，点击行查看全部引用用户。</span>
        </div>
      </main>

      <Sheet open={Boolean(selectedSource)} onOpenChange={(open) => { if (!open) setSelectedSource(null); }}>
        <SheetContent className="w-full overflow-y-auto border-border/70 p-0 sm:max-w-[560px]">
          {selectedSource && (
            <>
              <SheetHeader className="border-b border-border/60 px-6 py-6 pr-14">
                <SheetTitle className="text-xl tracking-[-0.025em]">{sourceName(selectedSource)}</SheetTitle>
                <SheetDescription className="break-all text-left font-mono text-xs leading-5">{selectedSource.url}</SheetDescription>
              </SheetHeader>
              <div className="space-y-7 p-6">
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">当前流量快照</h3>
                    <Button variant="ghost" size="sm" onClick={() => void copy(selectedSource.url)}>
                      {copied ? <CheckCircle weight="fill" className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                      {copied ? '已复制' : '复制地址'}
                    </Button>
                  </div>
                  {(() => {
                    const traffic = trafficOf(selectedSource);
                    if (!traffic) return <div className="rounded-[10px] bg-secondary/55 px-3 py-2 text-xs text-muted-foreground">该源暂未上报流量快照</div>;
                    const percent = Math.min(100, Math.max(0, traffic.usagePercent));
                    return (
                      <div>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <div className="text-sm"><span className="text-muted-foreground">剩余 </span><strong className="text-lg font-semibold tabular-nums">{formatTraffic(traffic.remaining)}</strong></div>
                          <span className="text-xs tabular-nums text-muted-foreground">已用 {formatTraffic(traffic.used)} / {formatTraffic(traffic.total)}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div className={cn('h-full rounded-full', percent >= 90 ? 'bg-amber-500' : 'bg-primary')} style={{ width: `${percent}%` }} />
                        </div>
                        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                          <span>已使用 {traffic.usagePercent.toFixed(2)}%</span>
                          <span>{expireText(traffic)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </section>
                <section>
                  <h3 className="mb-3 text-sm font-semibold">全部引用用户（{selectedSource.references.length}）</h3>
                  <div className="space-y-2">
                    {selectedSource.references.map((reference) => {
                      const user = users.find((item) => item.uid === reference.uid);
                      return (
                        <div key={`${reference.uid}-${reference.name}`} className="flex w-full items-center gap-3 rounded-xl bg-secondary/55 px-4 py-3">
                          <UserCircle weight="fill" className="h-5 w-5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{reference.uid}</span>
                            <span className="block truncate text-xs text-muted-foreground">{reference.name} · 更新 {exactTime(reference.stat.lastUpdated)}</span>
                          </span>
                          {user && (
                            <Link
                              href={`/config?uid=${encodeURIComponent(user.uid)}&token=${encodeURIComponent(user.accessToken)}`}
                              target="_blank"
                              className="flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
                            >
                              配置<ArrowSquareOut className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
