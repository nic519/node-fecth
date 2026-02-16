import { useState, useEffect, useCallback, useMemo } from 'react';
import { ApiResponse } from '@/types/api';
import { UserConfig } from '@/types/openapi-schemas';
import { DEFAULT_SUB_FLAG } from '@/config/constants';

export interface SyncStatus {
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
}

export interface DynamicInfo {
    id: string;
    url: string;
    traffic: string | null;
    updatedAt: string;
}

export interface SyncItemData {
    url: string;
    source: string;
    flag?: string;
}

export function useDynamicSync(config: UserConfig) {
    const [statuses, setStatuses] = useState<Record<string, SyncStatus>>({});
    const [dynamicInfos, setDynamicInfos] = useState<Record<string, DynamicInfo>>({});

    const items = useMemo<SyncItemData[]>(() => [
        ...(config.subscribe ? [{ url: config.subscribe, source: '主订阅', flag: DEFAULT_SUB_FLAG }] : []),
        ...(config.appendSubList || []).map(sub => ({ url: sub.subscribe, source: '追加订阅', flag: sub.flag }))
    ].filter(item => item.url), [config.subscribe, config.appendSubList]);

    // Initial fetch
    useEffect(() => {
        let isMounted = true;

        const fetchDynamicInfos = async () => {
            if (items.length === 0) return;

            try {
                const urls = items.map(item => item.url).join(',');
                const res = await fetch(`/api/dynamic/sync?urls=${encodeURIComponent(urls)}`);
                const data = (await res.json()) as ApiResponse<DynamicInfo[]>;

                if (isMounted && data.code === 0 && Array.isArray(data.data)) {
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

        return () => {
            isMounted = false;
        };
    }, [config.subscribe, config.appendSubList]);

    const syncUrl = useCallback(async (url: string) => {
        if (!url) return;
        setStatuses(prev => ({ ...prev, [url]: { status: 'loading', message: undefined } }));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const res = await fetch('/api/dynamic/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const data = (await res.json()) as ApiResponse;

            if (data.code === 0) {
                setStatuses(prev => ({ ...prev, [url]: { status: 'success', message: '已同步' } }));

                // Update dynamic info
                const updatedInfo = data.data as unknown as DynamicInfo;
                // Since POST might return partial info, we merge carefully
                // Assuming data.data contains the traffic info directly as per previous code observation
                // (data.data as any).traffic was used. Let's try to be safer.
                const responseData = data.data as any;

                setDynamicInfos(prev => ({
                    ...prev,
                    [url]: {
                        ...(prev[url] || { id: '', url, traffic: null, updatedAt: '' }), // fallback if not exists
                        traffic: responseData.traffic,
                        updatedAt: responseData.updatedAt || new Date().toISOString()
                    }
                }));

                // Clear success status after 3 seconds
                setTimeout(() => {
                    setStatuses(prev => {
                        if (prev[url]?.status === 'success') {
                            return { ...prev, [url]: { status: 'idle' } };
                        }
                        return prev;
                    });
                }, 3000);

            } else {
                setStatuses(prev => ({ ...prev, [url]: { status: 'error', message: data.msg || '失败' } }));
            }
        } catch (error: any) {
            const message = error.name === 'AbortError' ? '请求超时' : '网络错误';
            setStatuses(prev => ({ ...prev, [url]: { status: 'error', message } }));
        }
    }, []);

    const syncAll = useCallback(async () => {
        for (const item of items) {
            await syncUrl(item.url);
        }
    }, [items, syncUrl]);

    return {
        items,
        statuses,
        dynamicInfos,
        syncUrl,
        syncAll
    };
}
