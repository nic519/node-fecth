'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Calendar, ChartLine, Globe, MapPin, Monitor } from 'lucide-react';

import { HeartbeatStrip, HeartbeatWindowToggle } from '@/components/HeartbeatStrip';
import { ExpiryYearCalendar, type ExpiryCalendarEvent } from '@/components/ExpiryYearCalendar';
import { Skeleton } from '@/components/ui/skeleton';
import { UsageColumnBar } from '@/components/UsageColumnBar';
import { SourceUsageChart } from '@/components/UsageCurveChart';
import { cn } from '@/lib/utils';
import { buildSubscriptionListFromConfig } from '@/modules/user/subscription-list';
import { apiClient } from '@/services/api-client';
import { dynamicService, type DynamicInfo } from '@/services/dynamic-api';
import type { SubscriptionIpHeartbeat, SubscriptionIpStatus, SubscriptionUserActivity } from '@/types/subscription-analytics';
import type { UserConfig } from '@/types/user-config';
import { CommonUtils } from '@/utils/commonUtils';
import type { HeartbeatWindowDays } from '@/utils/heartbeatBins';
import { formatDateTime, formatTraffic, parseTrafficInfo } from '@/utils/trafficUtils';

type SubscriptionItem = NonNullable<UserConfig['appendSubList']>[number];

interface HeartbeatState {
    activity: SubscriptionUserActivity | null;
    windowEnd: string;
}

function formatRelativeTime(value?: string) {
    if (!value) return '暂无心跳';
    const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60_000));
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`;
    return `${Math.floor(minutes / 1440)} 天前`;
}

function statusLabel(status: SubscriptionIpStatus) {
    if (status === 'online') return '在线';
    if (status === 'recent') return '近期活跃';
    return '久未访问';
}

function statusDotClass(status: SubscriptionIpStatus) {
    if (status === 'online') return 'bg-primary';
    if (status === 'recent') return 'bg-amber-500';
    return 'bg-muted-foreground/30';
}

interface SubscriptionUsageCardProps {
    item: SubscriptionItem;
    info: DynamicInfo | null;
}

/**
 * 单个订阅源的用量卡片：顶部状态摘要，主体左为竖向剩余流量柱、右为使用曲线。
 */
function SubscriptionUsageCard({ item, info }: SubscriptionUsageCardProps) {
    const trafficInfo = info?.traffic ? parseTrafficInfo(info.traffic) : null;
    const hostLabel = item.subscribe.replace(/^https?:\/\//, '').split('/')[0] ?? item.subscribe;

    return (
        <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-4">
            {/* 行 1：源标识与更新时间同行 */}
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="min-w-0 truncate font-medium text-foreground" title={item.subscribe}>
                    {item.flag} {hostLabel}
                </span>
                <span className="shrink-0 tabular-nums" title="最后更新时间">
                    {info ? `更新于 ${formatDateTime(info.updatedAt)}` : '尚未同步'}
                </span>
            </div>

            {/* 行 2：剩余大字在左，已用/百分比/到期在右同行；到期空态收进行尾不独占一行。固定两行结构保证各卡片图表顶部对齐 */}
            {trafficInfo ? (
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <div className="text-sm">
                        <span className="text-xs text-muted-foreground">剩余 </span>
                        <strong className="text-lg font-semibold tabular-nums tracking-[-0.02em]">{formatTraffic(trafficInfo.remaining)}</strong>
                    </div>
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 text-xs tabular-nums text-muted-foreground">
                        <span>已用 {formatTraffic(trafficInfo.used)} / {formatTraffic(trafficInfo.total)}</span>
                        <span>已使用 {trafficInfo.usagePercent.toFixed(1)}%</span>
                        <span>
                            {trafficInfo.expire
                                ? `${trafficInfo.isExpired ? '已于 ' : '到期 '}${new Date(trafficInfo.expire * 1000).toLocaleDateString('zh-CN')}${trafficInfo.isExpired ? ' 到期' : ''}`
                                : '未提供到期时间'}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="text-xs text-muted-foreground">流量信息未知，同步后展示用量</div>
            )}

            <div className="flex items-stretch gap-3">
                {trafficInfo && (
                    <UsageColumnBar remainingBytes={trafficInfo.remaining} totalBytes={trafficInfo.total} height={104} />
                )}
                <SourceUsageChart url={item.subscribe} compact className="min-w-0 flex-1" />
            </div>
        </div>
    );
}

interface HeartbeatCardProps {
    heartbeat: SubscriptionIpHeartbeat;
    windowDays: HeartbeatWindowDays;
    windowEnd: string;
}

function HeartbeatCard({ heartbeat, windowDays, windowEnd }: HeartbeatCardProps) {
    const location = [heartbeat.location.country, heartbeat.location.city].filter(Boolean).join(' · ') || '未知地区';

    return (
        <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5">
            {/* 单卡压缩为两行：状态点 + IP + 全部元信息合并同行（窄屏自动换行），下为心跳格子条 */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={cn('h-2 w-2 rounded-full', statusDotClass(heartbeat.status))} />
                <span className="font-mono text-sm font-medium">{heartbeat.ip}</span>
                <span className="text-xs text-muted-foreground">{statusLabel(heartbeat.status)}</span>
                <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{location}</span>
                    <span className="flex items-center gap-1"><Monitor className="h-3.5 w-3.5" />{heartbeat.clientName}</span>
                    <span>{heartbeat.requestCount} 次请求</span>
                    <span>24 小时内 {heartbeat.last24hRequests} 次</span>
                    {heartbeat.medianIntervalMinutes !== null && (
                        <span>中位间隔约 {heartbeat.medianIntervalMinutes} 分钟</span>
                    )}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">{formatRelativeTime(heartbeat.lastSeen)}</span>
            </div>
            <div className="mt-2">
                <HeartbeatStrip heartbeat={heartbeat} windowEnd={windowEnd} windowDays={windowDays} />
            </div>
        </div>
    );
}

interface PanelUsageAnalyticsProps {
    config: UserConfig;
    uid?: string;
    token?: string;
}

/**
 * 用量分析面板：订阅流量使用趋势（柱状剩余量 + 曲线）与本账号的访问心跳。
 */
export function PanelUsageAnalytics({ config, uid, token }: PanelUsageAnalyticsProps) {
    const subscriptions = useMemo(
        () => buildSubscriptionListFromConfig({ appendSubList: config.appendSubList })
            .filter((item) => item.type !== 'inline' && /^https?:\/\//.test(item.subscribe)),
        [config.appendSubList],
    );

    const [infos, setInfos] = useState<DynamicInfo[]>([]);

    const urlsKey = subscriptions.map((item) => item.subscribe).join('\n');

    useEffect(() => {
        const urls = urlsKey.split('\n').filter(Boolean);
        let cancelled = false;
        if (urls.length === 0) {
            // lint: 避免在 effect 体内同步 setState
            queueMicrotask(() => {
                if (!cancelled) setInfos([]);
            });
            return () => {
                cancelled = true;
            };
        }
        // 读取服务端缓存的订阅摘要（不触发远程同步）
        dynamicService.syncUrls(urls)
            .then((response) => {
                if (!cancelled) setInfos(response.code === 0 && Array.isArray(response.data) ? response.data : []);
            })
            .catch(() => {
                if (!cancelled) setInfos([]);
            });
        return () => {
            cancelled = true;
        };
    }, [urlsKey]);

    const [heartbeat, setHeartbeat] = useState<HeartbeatState | null>(null);
    const [heartbeatLoading, setHeartbeatLoading] = useState(true);
    const [heartbeatError, setHeartbeatError] = useState('');
    // 心跳格子条窗口：24 小时（默认）或 14 天，切换时按更宽窗口重新取数
    const [heartbeatDays, setHeartbeatDays] = useState<HeartbeatWindowDays>(1);

    useEffect(() => {
        let cancelled = false;
        if (!uid || !token) {
            // lint: 避免在 effect 体内同步 setState
            queueMicrotask(() => {
                if (cancelled) return;
                setHeartbeat(null);
                setHeartbeatLoading(false);
            });
            return () => {
                cancelled = true;
            };
        }
        // uid/token/窗口变化时重置加载态（首次挂载时初始值已是 loading）
        queueMicrotask(() => {
            if (!cancelled) setHeartbeatLoading(true);
        });
        apiClient.get<SubscriptionUserActivity | null>('/user/analytics', { uid, token, heartbeatDays })
            .then((response) => {
                if (cancelled) return;
                if (response.code !== 0) {
                    setHeartbeatError(response.msg || '访问心跳加载失败');
                    setHeartbeat(null);
                    return;
                }
                setHeartbeat({
                    activity: response.data ?? null,
                    windowEnd: new Date().toISOString(),
                });
                setHeartbeatError('');
            })
            .catch((loadError) => {
                if (cancelled) return;
                setHeartbeatError(loadError instanceof Error ? loadError.message : '访问心跳加载失败');
                setHeartbeat(null);
            })
            .finally(() => {
                if (!cancelled) setHeartbeatLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [uid, token, heartbeatDays]);

    const findInfo = (url: string) => {
        const normalized = CommonUtils.normalizeUrl(url);
        return infos.find((info) => info.url === url || info.url === normalized) ?? null;
    };

    // 到期日历事件：取每个订阅源的流量快照到期时间；无快照或无到期时间的源不进入年历
    const expiryEvents = useMemo<ExpiryCalendarEvent[]>(() => subscriptions.flatMap((item) => {
        const info = findInfo(item.subscribe);
        const trafficInfo = info?.traffic ? parseTrafficInfo(info.traffic) : null;
        if (!trafficInfo?.expire) return [];
        const hostLabel = item.subscribe.replace(/^https?:\/\//, '').split('/')[0] ?? item.subscribe;
        return [{
            id: item.subscribe,
            dateMs: trafficInfo.expire * 1000,
            title: `${item.flag} ${hostLabel}`,
            subtitle: `剩余 ${formatTraffic(trafficInfo.remaining)} / ${formatTraffic(trafficInfo.total)}`,
            expired: trafficInfo.isExpired,
        }];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [subscriptions, infos]);

    // 列数按实际订阅数封顶：2 个源就两列拉满，不留空列
    const gridColsClass = subscriptions.length <= 1
        ? 'grid-cols-1'
        : subscriptions.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : subscriptions.length === 3
                ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';

    return (
        <div className="space-y-8">
            {subscriptions.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <ChartLine className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">订阅用量分析</h3>
                        <span className="text-xs text-muted-foreground">{subscriptions.length} 个订阅源</span>
                    </div>

                    <div className={cn('grid gap-4', gridColsClass)}>
                        {subscriptions.map((item) => (
                            <SubscriptionUsageCard key={item.subscribe} item={item} info={findInfo(item.subscribe)} />
                        ))}
                    </div>
                </section>
            )}

            {expiryEvents.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">到期日历</h3>
                        <span className="text-xs text-muted-foreground">本月起往后一年 · 点击日期过滤列表</span>
                    </div>
                    <ExpiryYearCalendar events={expiryEvents} />
                </section>
            )}

            <section className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">本账号的 IP 与连续心跳</h3>
                    <HeartbeatWindowToggle value={heartbeatDays} onChange={setHeartbeatDays} />
                    <span className="text-xs text-muted-foreground">{heartbeat?.activity?.uniqueIps ?? 0} 个 IP</span>
                </div>

                {heartbeatLoading ? (
                    <div className="space-y-3" aria-label="正在加载访问心跳">
                        {[0, 1].map((index) => (
                            <div key={index} className="rounded-xl border border-border/50 bg-muted/20 p-3.5">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-2 w-2 rounded-full" />
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="ml-auto h-3 w-14" />
                                </div>
                                <Skeleton className="mt-2 h-5 w-full" />
                            </div>
                        ))}
                    </div>
                ) : heartbeatError ? (
                    <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        {heartbeatError}
                    </div>
                ) : !heartbeat?.activity || heartbeat.activity.ips.length === 0 ? (
                    <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 text-center">
                        <Globe className="h-8 w-8 text-muted-foreground/35" />
                        <p className="mt-3 text-sm text-muted-foreground">暂无访问记录</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {heartbeat.activity.ips.map((item) => (
                            <HeartbeatCard
                                key={item.ip}
                                heartbeat={item}
                                windowDays={heartbeatDays}
                                windowEnd={heartbeat.windowEnd}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
