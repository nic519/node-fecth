import { Link as LinkIcon } from 'lucide-react';
import { UserConfig } from '@/types/user-config';
import { useDynamicSync } from '@/app/config/hooks/useDynamicSync';
import { PanelTopBar } from './PanelTopBar';
import { SyncItemCard } from '@/components/SyncItemCard';
import { setSubscriptionList } from '@/modules/user/subscription-list';
import type { SubscriptionProxyProvider } from '@/config/subscription-proxy.config';

interface DynamicSyncPanelProps {
    config: UserConfig;
    onChange: (newConfig: UserConfig) => void;
    readOnly?: boolean;
    availableProxyProviders: SubscriptionProxyProvider[];
}

export function PanelDynamicSync({
    config,
    onChange,
    readOnly = false,
    availableProxyProviders,
}: DynamicSyncPanelProps) {
    const { items, statuses, dynamicInfos, syncUrl } = useDynamicSync(config);

    const handleProxyProviderChange = (index: number, proxyProvider?: SubscriptionProxyProvider) => {
        const subscriptions = config.appendSubList ?? [];
        const nextSubscriptions = [...subscriptions];
        const currentSubscription = nextSubscriptions[index];
        if (!currentSubscription) {
            return;
        }

        nextSubscriptions[index] = {
            ...currentSubscription,
            proxyProvider,
        };

        onChange(setSubscriptionList(config, nextSubscriptions));
    };

    return (
        <div className="space-y-6">
            <PanelTopBar
                description={
                    <div className="space-y-1">
                        <div>共 {items.length} 个链接订阅源，可单独预更新。</div>
                        <div>粘贴节点在保存配置后生效，无需远程同步。</div>
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
                        readOnly={readOnly}
                        showUsageChart
                        availableProxyProviders={availableProxyProviders}
                        onProxyProviderChange={(proxyProvider) => handleProxyProviderChange(item.subscriptionIndex ?? index, proxyProvider)}
                        onSync={() => syncUrl(item.url, item.proxyProvider)}
                    />
                ))}
            </div>
        </div>
    );
}
