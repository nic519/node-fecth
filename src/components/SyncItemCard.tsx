'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle2, Clock, Activity } from 'lucide-react';
import { cn, secondaryActionButtonClass } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatTraffic, getTrafficBarColor, parseTrafficInfo, formatDateTime } from '@/utils/trafficUtils';
import type { SyncItemData, SyncStatus, DynamicInfo } from '@/app/config/hooks/useDynamicSync';

interface SyncItemCardProps {
  item: SyncItemData;
  status: SyncStatus;
  info?: DynamicInfo;
  onSync?: () => void;
  showAction?: boolean;
}

export function SyncItemCard({ item, status, info, onSync, showAction }: SyncItemCardProps) {
  const isLoading = status.status === 'loading';
  const isSuccess = status.status === 'success';
  const isError = status.status === 'error';
  const trafficInfo = info?.traffic ? parseTrafficInfo(info.traffic) : null;
  const usagePercent = trafficInfo ? Math.min(100, Math.max(0, trafficInfo.usagePercent)) : 0;
  const shouldShowAction = showAction ?? !!onSync;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={item.source === '主订阅' ? 'default' : 'secondary'} className="shrink-0">
              {item.flag} {item.source}
            </Badge>
          </div>

          <div
            className={cn(
              "h-2 w-2 rounded-full shrink-0 transition-colors duration-300",
              isLoading ? "bg-blue-500 animate-pulse" :
                isSuccess ? "bg-green-500" :
                  isError ? "bg-red-500" :
                    "bg-slate-200 dark:bg-slate-700"
            )}
          />
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-muted/50 p-2 rounded text-xs font-mono text-muted-foreground cursor-help select-all">
                <div className="line-clamp-2 break-all">
                  {item.url}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-[300px] break-all font-mono text-xs">{item.url}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex items-end justify-between gap-2 pt-2">
          <div className="space-y-1.5 flex-1 min-w-0">
            {info ? (
              <>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title="最后更新时间">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {formatDateTime(info.updatedAt)}
                  </span>
                </div>
                {info.traffic && (
                  <div className="space-y-1.5" title="流量信息">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 shrink-0" />
                        {trafficInfo ? (
                          <span className="truncate font-medium">
                            {formatTraffic(trafficInfo.used)} / {formatTraffic(trafficInfo.total)}
                          </span>
                        ) : (
                          <span className="truncate font-mono">
                            {info.traffic}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {trafficInfo ? `${trafficInfo.usagePercent.toFixed(1)}%` : ''}
                      </span>
                    </div>
                    {trafficInfo && (
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn("h-full transition-all", getTrafficBarColor(usagePercent))}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="h-8 flex items-center text-xs text-muted-foreground/50 italic">
                尚未同步信息
              </div>
            )}

            {status.message && (
              <p className={cn(
                "text-xs font-medium truncate",
                isError ? "text-red-500" : "text-green-500"
              )}>
                {status.message}
              </p>
            )}
          </div>

          {shouldShowAction ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={onSync}
              disabled={isLoading || !onSync}
              className={cn("h-8 w-8 p-0 shrink-0 rounded-full", secondaryActionButtonClass)}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white/90" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          ) : (
            <div className="h-8 w-8" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
