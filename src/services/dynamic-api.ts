import { apiClient } from './api-client';
import type { DynamicSummary } from '@/types/openapi-schemas';

export type DynamicInfo = DynamicSummary;

export const dynamicService = {
    syncUrls: (urls: string[]) => {
        return apiClient.post<DynamicInfo[]>('/dynamic/cache', { urls });
    },

    syncUrl: (url: string, signal?: AbortSignal) => {
        return apiClient.post<DynamicInfo>('/dynamic/sync', { url }, undefined, { signal });
    },
};
