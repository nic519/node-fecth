import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { UserConfig } from '@/types/user-config';
import { dynamicService, DynamicInfo } from '@/services/dynamic-api';
import { buildSubscriptionListFromConfig } from '@/modules/user/subscription-list';

const SYNC_TIMEOUT_MS = 30000;
const STATUS_RESET_DELAY_MS = 3000;

export type { DynamicInfo };

export interface SyncStatus {
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
}

// DynamicInfo 已经在 service 中定义，这里移除
export interface SyncItemData {
    url: string;
    source: string;
    flag?: string;
}

export function useDynamicSync(config: UserConfig) {
    const [statuses, setStatuses] = useState<Record<string, SyncStatus>>({});
    const [dynamicInfos, setDynamicInfos] = useState<Record<string, DynamicInfo>>({});
    const timeoutIdsRef = useRef<number[]>([]);

    const items = useMemo<SyncItemData[]>(() => {
        const subscriptions = buildSubscriptionListFromConfig(config);
        return subscriptions.map((sub, index) => ({
            url: sub.subscribe,
            source: index === 0 ? '主订阅' : '订阅源',
            flag: sub.flag,
        })).filter(item => item.url);
    }, [config]);

    const syncUrl = useCallback(async (url: string) => {
        if (!url) return;
        setStatuses(prev => ({ ...prev, [url]: { status: 'loading', message: undefined } }));

        try {
            // 使用 AbortSignal.timeout (30s) 替代手动的 setTimeout + AbortController，更简洁且自动处理资源清理
            const signal = AbortSignal.timeout(SYNC_TIMEOUT_MS);
            const response = await dynamicService.syncUrl(url, signal);

            if (response.code === 0) {
                setStatuses(prev => ({ ...prev, [url]: { status: 'success', message: '已同步' } }));

                // Update dynamic info
                const updatedInfo = response.data;

                setDynamicInfos(prev => ({
                    ...prev,
                    [url]: {
                        ...(prev[url] || { id: '', url, traffic: null, updatedAt: '' }), // fallback if not exists
                        traffic: updatedInfo.traffic,
                        updatedAt: updatedInfo.updatedAt || new Date().toISOString()
                    }
                }));

                // Clear success status after 3 seconds
                const resetTimeoutId = window.setTimeout(() => {
                    setStatuses(prev => {
                        if (prev[url]?.status === 'success') {
                            return { ...prev, [url]: { status: 'idle' } };
                        }
                        return prev;
                    });
                }, STATUS_RESET_DELAY_MS);
                timeoutIdsRef.current.push(resetTimeoutId);

            } else {
                setStatuses(prev => ({ ...prev, [url]: { status: 'error', message: response.msg || '失败' } }));
            }
        } catch (error: unknown) {
            // TimeoutError 是 AbortSignal.timeout 的标准超时错误
            const isTimeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
            const message = isTimeout ? '请求超时' : '网络错误';
            setStatuses(prev => ({ ...prev, [url]: { status: 'error', message } }));
        }
    }, []);


    // Initial fetch
    useEffect(() => {
        let isMounted = true;

        const fetchDynamicInfos = async () => {
            if (items.length === 0) return;

            try {
                const urls = items.map(item => item.url);
                const response = await dynamicService.syncUrls(urls);

                if (isMounted && response.code === 0 && Array.isArray(response.data)) {
                    const infoMap: Record<string, DynamicInfo> = {};
                    response.data.forEach((info: DynamicInfo) => {
                        infoMap[info.url] = info;
                    });
                    setDynamicInfos(infoMap);
                }
            } catch (error) {
                console.error('Failed to fetch dynamic infos:', error);
            }
        };

        fetchDynamicInfos();

        return () => {
            isMounted = false;
        };
    }, [items]);

    useEffect(() => {
        return () => {
            timeoutIdsRef.current.forEach((id) => clearTimeout(id));
            timeoutIdsRef.current = [];
        };
    }, []);

    return {
        items,
        statuses,
        dynamicInfos,
        syncUrl,
    };
}
