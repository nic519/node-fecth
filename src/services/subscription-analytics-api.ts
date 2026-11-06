import { apiClient } from '@/services/api-client';
import type { SubscriptionAnalyticsResult } from '@/types/subscription-analytics';

export const subscriptionAnalyticsApi = {
  // heartbeatDays 只影响心跳格子条的时间窗口（1 = 24 小时 / 14 = 14 天），不改变页面统计口径
  get: (params: { days: 1 | 7 | 30; heartbeatDays?: 1 | 14 }) =>
    apiClient.get<SubscriptionAnalyticsResult>('/admin/subscription-analytics', params),
};

