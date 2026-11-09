import { Link as LinkIcon } from 'lucide-react';
import { UserConfig } from '@/types/user-config';
import { useDynamicSync } from '@/app/config/hooks/useDynamicSync';
import { PanelUsageAnalytics } from './PanelUsageAnalytics';
import { PanelTopBar } from './PanelTopBar';
import { SyncItemCard } from '@/components/SyncItemCard';
import { setSubscriptionList } from '@/modules/user/subscription-list';
import type { SubscriptionProxyProvider } from '@/config/subscription-proxy.config';
import { InlineNodesCard } from './InlineNodesCard';

interface DynamicSyncPanelProps {
    config: UserConfig;
    onChange: (newConfig: UserConfig) => void;
    readOnly?: boolean;
    uid?: string;
    token?: string;
    availableProxyProviders: SubscriptionProxyProvider[];
}

export function PanelDynamicSync({
    config,
    onChange,
    readOnly = false,
    uid,
    token,
    availableProxyProviders,
}: DynamicSyncPanelProps) {
    const { items, statuses, dynamicInfos, syncUrl } = useDynamicSync(config);
    const inlineSources = (config.appendSubList ?? []).filter(item => item.type === 'inline');

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
                        {items.length > 0 && <div>共 {items.length} 个链接订阅源，可单独预更新。</div>}
                        {inlineSources.length > 0 && <div>当前{items.length > 0 ? '同时' : '直接'}使用 {inlineSources.length} 组节点列表，保存配置后生效，无需远程同步。</div>}
                        {items.length === 0 && inlineSources.length === 0 && <div>添加订阅链接或直接粘贴节点列表后，可在这里查看来源与访问心跳。</div>}
                    </div>
                }
            />

            {(items.length > 0 || inlineSources.length === 0) && <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.length === 0 && inlineSources.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/50">
                        <div className="flex flex-col items-center gap-2">
                            <LinkIcon className="w-8 h-8 opacity-50" />
                            <p>尚未添加节点来源</p>
                            <p className="text-xs">请到基础配置添加订阅链接或粘贴节点列表</p>
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
            </div>}

            {inlineSources.length > 0 && (
                <div className="space-y-4">
                    {inlineSources.map((item, index) => <InlineNodesCard key={index} item={item} />)}
                </div>
            )}

            <PanelUsageAnalytics config={config} infos={dynamicInfos} uid={uid} token={token} />
        </div>
    );
}
