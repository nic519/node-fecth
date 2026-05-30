'use client';

import type { DynamicInfo, SyncItemData, SyncStatus } from '@/app/config/hooks/useDynamicSync';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, secondaryActionButtonClass } from '@/lib/utils';
import { formatDateTime, formatTraffic, getTrafficBarColor, parseTrafficInfo } from '@/utils/trafficUtils';
import {
  SUBSCRIPTION_PROXY_PROVIDER_LABELS,
  SUBSCRIPTION_PROXY_PROVIDER_SHORT_LABELS,
  type SubscriptionProxyProvider,
} from '@/config/subscription-proxy.config';
import { Activity, Calendar, CheckCircle2, CircleHelp, Clock, Loader2, RefreshCw, Waypoints } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SyncItemCardProps {
  item: SyncItemData;
  status: SyncStatus;
  info?: DynamicInfo;
  onSync?: () => void;
  showAction?: boolean;
  readOnly?: boolean;
  availableProxyProviders: SubscriptionProxyProvider[];
  onProxyProviderChange?: (proxyProvider?: SubscriptionProxyProvider) => void;
}

export function SyncItemCard({
  item,
  status,
  info,
  onSync,
  showAction,
  readOnly,
  availableProxyProviders,
  onProxyProviderChange,
}: SyncItemCardProps) {
  const isLoading = status.status === 'loading';
  const isSuccess = status.status === 'success';
  const isError = status.status === 'error';
  const trafficInfo = info?.traffic ? parseTrafficInfo(info.traffic) : null;
  const usagePercent = trafficInfo ? Math.min(100, Math.max(0, trafficInfo.usagePercent)) : 0;
  const shouldShowAction = showAction ?? !!onSync;
  const proxyProviderShortLabel = item.proxyProvider
    ? SUBSCRIPTION_PROXY_PROVIDER_SHORT_LABELS[item.proxyProvider]
    : '直连';
  const shortUrl = item.url.replace(/^https?:\/\//, '');
  const hostLabel = shortUrl.split('/')[0] ?? shortUrl;
  const statusLabel = isLoading
    ? '同步中'
    : isError
      ? '访问异常'
      : info
        ? '已同步'
        : '未同步';
  const statusToneClass = isLoading
    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-300'
    : isError
      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-300'
      : info
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
        : 'bg-slate-500/10 text-slate-500 dark:text-slate-300';
  const statusDotClass = isLoading
    ? 'bg-sky-500'
    : isError
      ? 'bg-rose-500'
      : info
        ? 'bg-emerald-500'
        : 'bg-slate-300 dark:bg-slate-600';
  const summaryText = isError
    ? (status.message || '当前服务器暂时无法获取该订阅')
    : trafficInfo
      ? `已用 ${formatTraffic(trafficInfo.used)} / ${formatTraffic(trafficInfo.total)}`
      : info
        ? '可继续手动预更新'
        : '尚未同步信息';

  const [displayedPercent, setDisplayedPercent] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const progressElement = progressRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add a small delay to ensure the transition is noticeable
          timer = setTimeout(() => {
            setDisplayedPercent(usagePercent);
          }, 100);
        } else {
          // Reset when out of view to replay animation next time
          setDisplayedPercent(0);
          clearTimeout(timer);
        }
      },
      { threshold: 0.2 }
    );

    if (progressElement) {
      observer.observe(progressElement);
    }

    return () => {
      if (progressElement) {
        observer.unobserve(progressElement);
      }
      clearTimeout(timer);
    };
  }, [usagePercent]);

  return (
    <Card className="overflow-hidden border-border/70 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary" className="shrink-0">
            {item.flag} {item.source}
          </Badge>

          <div className={cn(
            'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium',
            statusToneClass,
          )}>
            <span className={cn('h-1.5 w-1.5 rounded-full', statusDotClass, isLoading && 'animate-pulse')} />
            <span>{statusLabel}</span>
          </div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help rounded-xl border border-border/50 bg-muted/25 px-3 py-2.5">
                <div className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                  {hostLabel}
                </div>
                <div className="mt-1 line-clamp-2 break-all font-mono text-sm text-foreground/80">
                  {shortUrl}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-[300px] break-all font-mono text-xs">{item.url}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title="最后更新时间">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {info ? `最后更新 ${formatDateTime(info.updatedAt)}` : '尚未建立同步记录'}
                </span>
              </div>
              <div className={cn(
                'truncate text-sm font-medium',
                isError ? 'text-rose-600 dark:text-rose-300' : 'text-foreground/80',
              )}>
                {summaryText}
              </div>
            </div>

            {trafficInfo && (
              <div className="space-y-1.5" title="流量信息">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate font-medium">流量占用</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {trafficInfo.usagePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary" ref={progressRef}>
                  <div
                    className={cn('h-full rounded-full transition-all duration-1000 ease-out', getTrafficBarColor(usagePercent))}
                    style={{ width: `${displayedPercent}%` }}
                  />
                </div>
                {trafficInfo.expire && (
                  <div className="flex items-center gap-1.5 pt-0.5 text-xs text-muted-foreground" title="到期时间">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      到期时间 {new Date(trafficInfo.expire * 1000).toLocaleString('zh-CN')}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-2">
              <div className="shrink-0">
                <Select
                  value={item.proxyProvider ?? '__direct__'}
                  onValueChange={(value) => onProxyProviderChange?.(
                    value === '__direct__' ? undefined : value as SubscriptionProxyProvider,
                  )}
                  disabled={readOnly}
                >
                  <SelectTrigger
                    aria-label={`sync-proxy-provider-${item.flag ?? item.url}`}
                    className="h-7 w-[84px] rounded-full border-border/40 bg-transparent px-2.5 text-xs shadow-none"
                  >
                    <SelectValue>{proxyProviderShortLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__direct__">直连</SelectItem>
                    {availableProxyProviders.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {SUBSCRIPTION_PROXY_PROVIDER_LABELS[provider]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                <Waypoints className="h-3.5 w-3.5 shrink-0" />
                <span>应急访问</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="subscription-proxy-help"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground"
                    >
                      <CircleHelp className="h-3.5 w-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" sideOffset={8} className="max-w-64 text-xs leading-5">
                    <p>
                      某些订阅源在本机网络下本来就无法直连，这时可以改由其他服务器代为拉取，并且只建议在本地拉取不了订阅时启用。
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {shouldShowAction ? (
            <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSync?.()}
                disabled={isLoading || !onSync}
                className={cn('h-8 w-8 rounded-full p-0 shrink-0', secondaryActionButtonClass)}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white/90" />
                ) : isSuccess ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <div className="h-8 w-8" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
