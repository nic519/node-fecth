import { createClient } from '@libsql/client';
import { afterEach, beforeEach, expect, mock, spyOn, test } from 'bun:test';
import { drizzle } from 'drizzle-orm/libsql';
import * as nextServer from 'next/server';

import * as schema from '@/db/schema';
import { GET as subscriptionGet } from '@/app/api/subscription/route';
import { GET as aliasGet } from '@/app/api/x/route';
import { ClashHandler } from '@/modules/yamlMerge/clashHandler';
import type { SubscriptionOutcome } from '@/modules/yamlMerge/strategyMultiSub';
import * as auth from '@/server/auth';
import * as serverDb from '@/server/db';
import { subscriptionRequest } from '@/server/subscription-request';
import * as analytics from '@/services/subscription-analytics';
import { LogService } from '@/services/log-service';

let client: ReturnType<typeof createClient>;
let deferred: (() => unknown)[];

beforeEach(() => {
  client = createClient({ url: 'file::memory:' });
  const db = drizzle(client, { schema });
  deferred = [];
  spyOn(serverDb, 'getServerDb').mockReturnValue(db);
  spyOn(auth, 'authenticateUserConfig').mockResolvedValue({ accessToken: 'secret', appendSubList: [] });
  spyOn(nextServer, 'after').mockImplementation((callback) => {
    if (typeof callback !== 'function') throw new Error('Expected deferred callback');
    deferred.push(callback);
  });
  spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  mock.restore();
  client.close();
});

function request() {
  return new nextServer.NextRequest('https://example.com/api/subscription?uid=demo&token=secret', {
    headers: { 'cf-connecting-ip': '203.0.113.10', 'x-vercel-ip-city': 'Hong%20Kong', 'user-agent': 'Mihomo/1' },
  });
}
const context = { params: Promise.resolve({}) };

test('both subscription route aliases expose the same authenticated handler', () => {
  expect(subscriptionGet).toBe(subscriptionRequest);
  expect(aliasGet).toBe(subscriptionRequest);
});

for (const scenario of [
  { result: 'success', level: 'info', failedCount: 0, staleCount: 0, status: 200 },
  { result: 'partial', level: 'warn', failedCount: 1, staleCount: 0, status: 200 },
  { result: 'partial', level: 'warn', failedCount: 0, staleCount: 1, status: 200 },
  { result: 'failure', level: 'error', failedCount: 1, staleCount: 0, status: 500 },
  { result: 'failure', level: 'error', failedCount: 2, staleCount: 0, status: 200 },
]) {
  test(`subscription ${scenario.result} (${scenario.failedCount} failed, ${scenario.staleCount} stale) emits one deferred final event`, async () => {
    const original = request();
    const response = new Response('proxies: []', { status: scenario.status });
    spyOn(ClashHandler.prototype, 'handle').mockImplementation(async (_request, params) => {
      const outcome: SubscriptionOutcome = params!.outcome;
      Object.assign(outcome, { sourceCount: 2, successCount: 2 - scenario.failedCount, failedCount: scenario.failedCount, staleCount: scenario.staleCount });
      params!.meta.nodeCount = 4;
      return response;
    });
    const record = spyOn(analytics, 'recordSubscriptionAccess').mockResolvedValue();
    const log = spyOn(LogService.prototype, 'log').mockResolvedValue(null);
    expect(await subscriptionGet(original, context)).toBe(response);
    expect(log).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
    expect(deferred).toHaveLength(1);
    await deferred[0]();
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toMatchObject({
      level: scenario.level, type: 'subscription_access', userId: 'demo',
      meta: { result: scenario.result, failedCount: scenario.failedCount, staleCount: scenario.staleCount, nodeCount: 4 },
    });
    expect(record).toHaveBeenCalledTimes(1);
    expect(record.mock.calls[0][1]).toBe(original);
    expect(record.mock.calls[0][2]).toBe('demo');
    expect(record.mock.calls[0][1].headers.get('x-vercel-ip-city')).toBe('Hong%20Kong');
    expect(record.mock.calls[0][1].headers.get('cf-connecting-ip')).toBe('203.0.113.10');
  });
}

test('unexpected generation exception returns failure and emits one final event', async () => {
  spyOn(ClashHandler.prototype, 'handle').mockRejectedValue(new Error('generation failed'));
  const record = spyOn(analytics, 'recordSubscriptionAccess').mockResolvedValue();
  const log = spyOn(LogService.prototype, 'log').mockResolvedValue(null);
  const response = await aliasGet(request(), context);
  expect(response.status).toBe(500);
  expect(deferred).toHaveLength(1);
  await deferred[0]();
  expect(record).toHaveBeenCalledTimes(1);
  expect(log).toHaveBeenCalledTimes(1);
  expect(log.mock.calls[0][0]).toMatchObject({ level: 'error', meta: { result: 'failure', error: 'generation failed' } });
});

test('deferred storage failures leave the successful response intact and attempt both writes', async () => {
  const response = new Response('proxies: []');
  spyOn(ClashHandler.prototype, 'handle').mockResolvedValue(response);
  const record = spyOn(analytics, 'recordSubscriptionAccess').mockRejectedValue(new Error('analytics unavailable'));
  const log = spyOn(LogService.prototype, 'log').mockRejectedValue(new Error('logs unavailable'));
  expect(await subscriptionGet(request(), context)).toBe(response);
  await deferred[0]();
  expect(response.status).toBe(200);
  expect(await response.text()).toBe('proxies: []');
  expect(record).toHaveBeenCalledTimes(1);
  expect(log).toHaveBeenCalledTimes(1);
});

test('deferred scheduling failure leaves the successful response intact', async () => {
  const response = new Response('proxies: []');
  spyOn(ClashHandler.prototype, 'handle').mockResolvedValue(response);
  spyOn(nextServer, 'after').mockImplementation(() => { throw new Error('scheduler unavailable'); });
  expect(await subscriptionGet(request(), context)).toBe(response);
});
