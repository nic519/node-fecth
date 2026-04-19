import { expect, test } from 'bun:test';

import {
  buildSubscriptionListFromConfig,
  setSubscriptionList,
} from '@/modules/user/subscription-list';
import type { UserConfig } from '@/types/user-config';

test('buildSubscriptionListFromConfig returns normalized appendSubList items', () => {
  const subscriptions = buildSubscriptionListFromConfig({
    appendSubList: [
      { subscribe: '  https://primary.example.com/sub  ', flag: ' A ' },
      { subscribe: 'https://secondary.example.com/sub', flag: 'B' },
    ],
  });

  expect(subscriptions).toEqual([
    { subscribe: 'https://primary.example.com/sub', flag: 'A' },
    { subscribe: 'https://secondary.example.com/sub', flag: 'B' },
  ]);
});

test('buildSubscriptionListFromConfig ignores empty appendSubList items', () => {
  const subscriptions = buildSubscriptionListFromConfig({
    appendSubList: [
      { subscribe: '   ', flag: 'A' },
      { subscribe: 'https://secondary.example.com/sub', flag: 'B' },
    ],
  });

  expect(subscriptions).toEqual([
    { subscribe: 'https://secondary.example.com/sub', flag: 'B' },
  ]);
});

test('setSubscriptionList preserves an intentionally empty flag', () => {
  const config: UserConfig = {
    accessToken: 'token',
    appendSubList: [
      { subscribe: 'https://primary.example.com/sub', flag: 'A' },
    ],
  };

  expect(setSubscriptionList(config, [
    { subscribe: 'https://primary.example.com/sub', flag: '' },
  ])).toEqual({
    accessToken: 'token',
    appendSubList: [
      { subscribe: 'https://primary.example.com/sub', flag: '' },
    ],
  });
});
