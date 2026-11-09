'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Calendar, Globe, MapPin, Monitor } from 'lucide-react';

import { HeartbeatStrip, HeartbeatWindowToggle } from '@/components/HeartbeatStrip';
import { ExpiryYearCalendar, type ExpiryCalendarEvent } from '@/components/ExpiryYearCalendar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { buildSubscriptionListFromConfig } from '@/modules/user/subscription-list';
import { apiClient } from '@/services/api-client';
import { type DynamicInfo } from '@/services/dynamic-api';
import type { SubscriptionIpHeartbeat, SubscriptionIpStatus, SubscriptionUserActivity } from '@/types/subscription-analytics';
import type { UserConfig } from '@/types/user-config';
import { CommonUtils } from '@/utils/commonUtils';
import type { HeartbeatWindowDays } from '@/utils/heartbeatBins';
import { formatTraffic, parseTrafficInfo } from '@/utils/trafficUtils';

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
    infos: Record<string, DynamicInfo>;
    uid?: string;
    token?: string;
}

/**
 * 订阅到期日历与本账号的访问心跳。
 */
export function PanelUsageAnalytics({ config, infos, uid, token }: PanelUsageAnalyticsProps) {
    const subscriptions = useMemo(
        () => buildSubscriptionListFromConfig({ appendSubList: config.appendSubList })
            .filter((item) => item.type !== 'inline' && /^https?:\/\//.test(item.subscribe)),
        [config.appendSubList],
    );

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
        return infos[url] ?? infos[normalized] ?? null;
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

    return (
        <div className="space-y-8">
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
