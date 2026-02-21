import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle2, Clock, Activity, Link as LinkIcon } from 'lucide-react';
import { UserConfig } from '@/types/user-config';
import { useDynamicSync, SyncItemData, SyncStatus, DynamicInfo } from '@/app/config/hooks/useDynamicSync';
import { cn, secondaryActionButtonClass } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatTraffic, getTrafficBarColor, parseTrafficInfo, formatDateTime } from '@/utils/trafficUtils';
import { PanelTopBar } from './PanelTopBar';

interface DynamicSyncPanelProps {
    config: UserConfig;
}

export function PanelDynamicSync({ config }: DynamicSyncPanelProps) {
    const { items, statuses, dynamicInfos, syncUrl } = useDynamicSync(config);

    return (
        <div className="space-y-6">
            <PanelTopBar
                description={
                    <div className="space-y-1">
                        <div>共 {items.length} 个订阅源，可单独预更新。</div>
                        <div>订阅源较多时再使用，绝大多数情况可忽略。</div>
                    </div>
                }
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/50">
                        <div className="flex flex-col items-center gap-2">
                            <LinkIcon className="w-8 h-8 opacity-50" />
                            <p>暂无订阅源</p>
                        </div>
                    </div>
                )}

                {items.map((item, index) => (
                    <SyncItem
                        key={`${index}-${item.url}`}
                        item={item}
                        status={statuses[item.url] || { status: 'idle' }}
                        info={dynamicInfos[item.url]}
                        onSync={() => syncUrl(item.url)}
                    />
                ))}
            </div>
        </div>
    );
}

interface SyncItemProps {
    item: SyncItemData;
    status: SyncStatus;
    info?: DynamicInfo;
    onSync: () => void;
}

function SyncItem({ item, status, info, onSync }: SyncItemProps) {
    const isLoading = status.status === 'loading';
    const isSuccess = status.status === 'success';
    const isError = status.status === 'error';
    const trafficInfo = info?.traffic ? parseTrafficInfo(info.traffic) : null;
    const usagePercent = trafficInfo ? Math.min(100, Math.max(0, trafficInfo.usagePercent)) : 0;

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md">
            <CardContent className="p-4 space-y-3">
                {/* Header: Badges */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Badge variant={item.source === '主订阅' ? 'default' : 'secondary'} className="shrink-0">
                            {item.flag} {item.source}
                        </Badge>
                    </div>

                    {/* Status Indicator */}
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

                {/* URL */}
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

                {/* Info & Actions */}
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

                        {/* Error Message */}
                        {status.message && (
                            <p className={cn(
                                "text-xs font-medium truncate",
                                isError ? "text-red-500" : "text-green-500"
                            )}>
                                {status.message}
                            </p>
                        )}
                    </div>

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onSync}
                        disabled={isLoading}
                        className={cn("h-8 w-8 p-0 shrink-0 rounded-full", secondaryActionButtonClass)}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-white/90" />
                        ) : isSuccess ? (
                            <CheckCircle2 className="w-4 h-4" />
                        ) : isError ? (
                            <RefreshCw className="w-4 h-4" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
