import { apiClient } from '@/services/api-client';
import type { SubscriptionAnalyticsResult } from '@/types/subscription-analytics';

export const subscriptionAnalyticsApi = {
  get: (params: { superToken: string; days: 1 | 7 | 30 }) =>
    apiClient.get<SubscriptionAnalyticsResult>('/admin/subscription-analytics', params),
};

