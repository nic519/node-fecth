import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { UserConfig } from '@/types/openapi-schemas';

interface DynamicSyncPanelProps {
    config: UserConfig;
}

interface SyncStatus {
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
}

export function DynamicSyncPanel({ config }: DynamicSyncPanelProps) {
    const [statuses, setStatuses] = useState<Record<string, SyncStatus>>({});

    const items = [
        ...(config.subscribe ? [{ url: config.subscribe, source: '主订阅' }] : []),
        ...(config.appendSubList || []).map(sub => ({ url: sub.subscribe, source: '追加订阅' }))
    ].filter(item => item.url);

    const handleSync = async (url: string) => {
        if (!url) return;
        setStatuses(prev => ({ ...prev, [url]: { status: 'loading' } }));

        try {
            const res = await fetch('/api/dynamic/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });
            const data = await res.json();

            if (data.code === 0) {
                setStatuses(prev => ({ ...prev, [url]: { status: 'success', message: '已同步' } }));
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
