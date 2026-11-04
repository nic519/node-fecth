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

export interface SubscriptionAnalyticsResult {
  generatedAt: string;
  windowStart: string;
  rangeDays: 1 | 7 | 30;
  truncated: boolean;
  totals: {
    users: number;
    uniqueIps: number;
    activeIps: number;
    requests: number;
  };
  users: SubscriptionUserActivity[];
}

