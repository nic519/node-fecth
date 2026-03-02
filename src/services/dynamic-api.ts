import { apiClient } from './api-client';

export interface DynamicInfo {
    id: string;
    url: string;
    traffic: string | null;
    updatedAt: string;
}

export const dynamicService = {
    syncUrls: (urls: string[]) => {
        return apiClient.post<DynamicInfo[]>('/dynamic/cache', { urls });
    },

    syncUrl: (url: string, useProxy?: boolean, signal?: AbortSignal) => {
        return apiClient.post<DynamicInfo>('/dynamic/sync', { url, useProxy }, undefined, { signal });
    },
};
