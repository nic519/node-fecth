import { apiClient } from './api-client';
import type { DynamicSummary } from '@/types/openapi-schemas';

export type DynamicInfo = DynamicSummary;

export const dynamicService = {
    syncUrls: (urls: string[]) => {
        return apiClient.post<DynamicInfo[]>('/dynamic/cache', { urls });
    },

    syncUrl: (url: string, useProxy?: boolean, signal?: AbortSignal) => {
        return apiClient.post<DynamicInfo>('/dynamic/sync', { url, useProxy }, undefined, { signal });
    },
};
