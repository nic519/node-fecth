import { apiClient } from './api-client';

export interface DynamicInfo {
    id: string;
    url: string;
    traffic: string | null;
    updatedAt: string;
}

export const dynamicService = {
    /**
     * 批量同步动态信息
     * GET /api/dynamic/sync?urls=url1,url2
     */
    syncUrls: (urls: string[]) => {
        return apiClient.get<DynamicInfo[]>('/dynamic/sync', { urls: urls.join(',') });
    },

    /**
     * 同步单个 URL
     * POST /api/dynamic/sync
     */
    syncUrl: (url: string, signal?: AbortSignal) => {
        return apiClient.post<DynamicInfo>('/dynamic/sync', { url }, undefined, { signal });
    },
};
