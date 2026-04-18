import { Link as LinkIcon } from 'lucide-react';
import { UserConfig } from '@/types/user-config';
import { useDynamicSync } from '@/app/config/hooks/useDynamicSync';
import { PanelTopBar } from './PanelTopBar';
import { SyncItemCard } from '@/components/SyncItemCard';

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
                    <SyncItemCard
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
