import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { UserConfig } from '@/types/user-config';
import { DEFAULT_SUB_FLAG } from '@/config/constants';
import { dynamicService, DynamicInfo } from '@/services/dynamic-api';

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

    const items = useMemo<SyncItemData[]>(() => [
        ...(config.subscribe ? [{ url: config.subscribe, source: '主订阅', flag: DEFAULT_SUB_FLAG }] : []),
        ...(config.appendSubList || []).map(sub => ({ url: sub.subscribe, source: '追加订阅', flag: sub.flag }))
    ].filter(item => item.url), [config.subscribe, config.appendSubList]);

    const syncUrl = useCallback(async (url: string) => {
        if (!url) return;
        setStatuses(prev => ({ ...prev, [url]: { status: 'loading', message: undefined } }));

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 30000);

        try {
            const response = await dynamicService.syncUrl(url, controller.signal);

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
                }, 3000);
                timeoutIdsRef.current.push(resetTimeoutId);

            } else {
                setStatuses(prev => ({ ...prev, [url]: { status: 'error', message: response.msg || '失败' } }));
            }
        } catch (error: unknown) {
            const message = error instanceof Error && error.name === 'AbortError' ? '请求超时' : '网络错误';
            setStatuses(prev => ({ ...prev, [url]: { status: 'error', message } }));
        } finally {
            clearTimeout(timeoutId);
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
