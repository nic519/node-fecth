export type SubscriptionIpStatus = 'online' | 'recent' | 'stale';

export interface SubscriptionIpHeartbeat {
  ip: string;
  status: SubscriptionIpStatus;
  firstSeen: string;
  lastSeen: string;
  requestCount: number;
  last24hRequests: number;
  medianIntervalMinutes: number | null;
  location: {
    city?: string;
    region?: string;
    country?: string;
    continent?: string;
  };
  userAgent: string;
  clientName: string;
  recentHeartbeats: string[];
}

export interface SubscriptionUserActivity {
  userId: string;
  requestCount: number;
  uniqueIps: number;
  activeIps: number;
  recentIps: number;
  lastSeen: string;
  locations: Array<{ name: string; count: number }>;
  clients: Array<{ name: string; count: number }>;
  ips: SubscriptionIpHeartbeat[];
}

export interface SubscriptionTrendPoint {
  start: string;
  requests: number;
  uniqueIps: number;
}

export interface SubscriptionTrend {
  granularity: 'hour' | 'day';
  points: SubscriptionTrendPoint[];
}

export interface SubscriptionAnalyticsResult {
  generatedAt: string;
  windowStart: string;
  rangeDays: 1 | 7 | 30;
  truncated: boolean;
  trend: SubscriptionTrend;
  totals: {
    users: number;
    uniqueIps: number;
    activeIps: number;
    requests: number;
  };
  users: SubscriptionUserActivity[];
}

