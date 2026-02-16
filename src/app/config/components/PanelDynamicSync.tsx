import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle2, XCircle, Clock, Activity } from 'lucide-react';
import { UserConfig } from '@/types/openapi-schemas';
import { ApiResponse } from '@/types/api';

interface DynamicSyncPanelProps {
    config: UserConfig;
}

interface SyncStatus {
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
}

interface DynamicInfo {
    id: string;
    url: string;
    traffic: string | null;
    updatedAt: string;
}

export function PanelDynamicSync({ config }: DynamicSyncPanelProps) {
    const [statuses, setStatuses] = useState<Record<string, SyncStatus>>({});
    const [dynamicInfos, setDynamicInfos] = useState<Record<string, DynamicInfo>>({});

    const items = [
        ...(config.subscribe ? [{ url: config.subscribe, source: '主订阅' }] : []),
        ...(config.appendSubList || []).map(sub => ({ url: sub.subscribe, source: '追加订阅' }))
    ].filter(item => item.url);

    useEffect(() => {
        const fetchDynamicInfos = async () => {
            if (items.length === 0) return;

            try {
                const urls = items.map(item => item.url).join(',');
                const res = await fetch(`/api/dynamic/sync?urls=${encodeURIComponent(urls)}`);
                const data = (await res.json()) as ApiResponse<DynamicInfo[]>;

                if (data.code === 0 && Array.isArray(data.data)) {
                    const infoMap: Record<string, DynamicInfo> = {};
                    data.data.forEach(info => {
                        infoMap[info.url] = info;
                    });
                    setDynamicInfos(infoMap);
                }
            } catch (error) {
                console.error('Failed to fetch dynamic infos:', error);
            }
        };

        fetchDynamicInfos();
    }, [config.subscribe, config.appendSubList]); // Re-fetch when config changes

    const handleSync = async (url: string) => {
        if (!url) return;
        setStatuses(prev => ({ ...prev, [url]: { status: 'loading' } }));

        try {
            const res = await fetch('/api/dynamic/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });
            const data = (await res.json()) as ApiResponse;

            if (data.code === 0) {
                setStatuses(prev => ({ ...prev, [url]: { status: 'success', message: '已同步' } }));
                // Refresh info after sync
                const updatedInfo = data.data as unknown as DynamicInfo; // POST returns partial info
                // We might need to fetch again or just update local state if POST returns enough info
                // The POST endpoint returns { id, url, traffic } but not full updated record with updatedAt
                // But we can estimate updatedAt or just re-fetch. 
                // Let's just update with what we have and set updatedAt to now.
                setDynamicInfos(prev => ({
                    ...prev,
                    [url]: {
                        ...prev[url],
                        traffic: (data.data as any).traffic,
                        updatedAt: new Date().toISOString()
                    } as DynamicInfo
                }));

            } else {
                setStatuses(prev => ({ ...prev, [url]: { status: 'error', message: data.msg || '失败' } }));
            }
        } catch (error) {
            setStatuses(prev => ({ ...prev, [url]: { status: 'error', message: '网络错误' } }));
        }
    };

    const handleSyncAll = async () => {
        for (const item of items) {
            await handleSync(item.url);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">动态订阅管理</h3>
                    <p className="text-sm text-muted-foreground">
                        共 {items.length} 个订阅源。可以单独更新并同步到数据库。
                    </p>
                </div>
                <Button
                    onClick={handleSyncAll}
                    variant="outline"
                    disabled={items.length === 0 || items.some(item => statuses[item.url]?.status === 'loading')}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${items.some(item => statuses[item.url]?.status === 'loading') ? 'animate-spin' : ''}`} />
                    全部更新
                </Button>
            </div>

            <div className="grid gap-4">
                {items.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                        暂无订阅源
                    </div>
                )}

                {items.map((item, index) => {
                    const status = statuses[item.url] || { status: 'idle' };
                    return (
                        <Card key={`${index}-${item.url}`} className="overflow-hidden">
                            <CardContent className="p-4 flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0 grid gap-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={item.source === '主订阅' ? 'default' : 'secondary'}>
                                            {item.source}
                                        </Badge>
                                        <span className="font-mono text-xs text-muted-foreground truncate" title={item.url}>
                                            {item.url}
                                        </span>
                                    </div>
                                    {dynamicInfos[item.url] && (
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                            <div className="flex items-center gap-1" title="最后更新时间">
                                                <Clock className="w-3 h-3" />
                                                <span>
                                                    {new Date(dynamicInfos[item.url].updatedAt).toLocaleString()}
                                                </span>
                                            </div>
                                            {dynamicInfos[item.url].traffic && (
                                                <div className="flex items-center gap-1" title="流量信息">
                                                    <Activity className="w-3 h-3" />
                                                    <span className="truncate max-w-[200px]">
                                                        {dynamicInfos[item.url].traffic}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {status.message && (
                                        <p className={`text-xs ${status.status === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                                            {status.message}
                                        </p>
                                    )}
                                </div>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSync(item.url)}
                                    disabled={status.status === 'loading'}
                                >
                                    {status.status === 'loading' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : status.status === 'success' ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : status.status === 'error' ? (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4" />
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
