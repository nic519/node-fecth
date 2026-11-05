import { expect, test } from 'bun:test';

import { aggregateSubscriptionAccessLogs } from '@/services/subscription-analytics';

const now = new Date('2026-11-04T06:00:00.000Z');

test('subscription analytics counts only access logs containing request headers', () => {
  const result = aggregateSubscriptionAccessLogs([
    {
      userId: 'sw-big',
      createdAt: '2026-11-04T05:50:00.000Z',
      meta: {
        headers: {
          'x-real-ip': '116.227.76.226',
          'user-agent': 'ClashMetaForAndroid/2.11.16.Meta',
          'x-vercel-ip-city': 'Hong%20Kong',
          'x-vercel-ip-country': 'CN',
        },
      },
    },
    {
      userId: 'sw-big',
      createdAt: '2026-11-04T05:55:00.000Z',
      meta: { timings: { total: 100 }, contentLength: 42 },
    },
  ], { now, rangeDays: 1 });

  expect(result.totals.requests).toBe(1);
  expect(result.totals.uniqueIps).toBe(1);
  expect(result.users[0].ips[0]).toMatchObject({
    ip: '116.227.76.226',
    status: 'online',
    clientName: 'Clash Meta Android',
    requestCount: 1,
    location: { city: 'Hong Kong' },
  });
});

test('subscription analytics groups heartbeats by user and IP', () => {
  const rows = [0, 30, 60].map((minutes) => ({
    userId: 'sw-big',
    createdAt: new Date(now.getTime() - minutes * 60_000).toISOString(),
    meta: {
      headers: {
        forwarded: 'for=203.0.113.10;host=node.1024.hair;proto=https',
        'user-agent': 'clash-verge/v2',
      },
    },
  }));

  const result = aggregateSubscriptionAccessLogs(rows, { now, rangeDays: 7 });
  const heartbeat = result.users[0].ips[0];

  expect(result.users[0].requestCount).toBe(3);
  expect(heartbeat.ip).toBe('203.0.113.10');
  expect(heartbeat.medianIntervalMinutes).toBe(30);
  expect(heartbeat.recentHeartbeats).toHaveLength(3);
});

