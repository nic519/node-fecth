import { expect, test } from 'bun:test';

import { DEFAULT_SUB_FLAG } from '@/config/constants';
import {
  buildSubscriptionListFromConfig,
  getPrimarySubscriptionUrl,
  setPrimarySubscriptionUrl,
} from '@/modules/user/subscription-list';

test('buildSubscriptionListFromConfig prefers appendSubList and avoids duplicating subscribe', () => {
  const subscriptions = buildSubscriptionListFromConfig({
    subscribe: 'https://primary.example.com/sub',
    appendSubList: [
      { subscribe: 'https://primary.example.com/sub', flag: 'A' },
      { subscribe: 'https://secondary.example.com/sub', flag: 'B' },
    ],
  });

  expect(subscriptions).toEqual([
    { subscribe: 'https://primary.example.com/sub', flag: 'A' },
    { subscribe: 'https://secondary.example.com/sub', flag: 'B' },
  ]);
});

test('buildSubscriptionListFromConfig prepends legacy subscribe when appendSubList misses it', () => {
  const subscriptions = buildSubscriptionListFromConfig({
    subscribe: 'https://primary.example.com/sub',
    appendSubList: [{ subscribe: 'https://secondary.example.com/sub', flag: 'B' }],
  });

  expect(subscriptions).toEqual([
    { subscribe: 'https://primary.example.com/sub', flag: DEFAULT_SUB_FLAG },
    { subscribe: 'https://secondary.example.com/sub', flag: 'B' },
  ]);
});

test('setPrimarySubscriptionUrl updates the first appendSubList item and keeps other config fields intact', () => {
  const next = setPrimarySubscriptionUrl(
    {
      subscribe: 'https://old.example.com/sub',
      accessToken: 'token',
      excludeRegex: 'Standard',
      appendSubList: [{ subscribe: 'https://old.example.com/sub', flag: 'A' }],
    },
    'https://new.example.com/sub',
  );

  expect(next.subscribe).toBe('https://new.example.com/sub');
  expect(next.excludeRegex).toBe('Standard');
  expect(next.appendSubList).toEqual([{ subscribe: 'https://new.example.com/sub', flag: 'A' }]);
});

test('getPrimarySubscriptionUrl reads the first appendSubList item before legacy subscribe', () => {
  const subscribe = getPrimarySubscriptionUrl({
    subscribe: 'https://legacy.example.com/sub',
    appendSubList: [{ subscribe: 'https://primary.example.com/sub', flag: 'A' }],
  });

  expect(subscribe).toBe('https://primary.example.com/sub');
});
