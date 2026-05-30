import { apiClient } from './api-client';
import type { DynamicSummary } from '@/types/api-schemas';
import type { SubscriptionProxyProvider } from '@/config/subscription-proxy.config';

export type DynamicInfo = DynamicSummary;

export const dynamicService = {
    syncUrls: (urls: string[]) => {
        return apiClient.post<DynamicInfo[]>('/dynamic/cache', { urls });
    },

    syncUrl: (url: string, proxyProvider?: SubscriptionProxyProvider, signal?: AbortSignal) => {
        return apiClient.post<DynamicInfo>('/dynamic/sync', { url, proxyProvider }, undefined, { signal });
    },
};
