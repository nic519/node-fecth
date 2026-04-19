import { expect, test } from 'bun:test';

import {
  buildSubscriptionListFromConfig,
} from '@/modules/user/subscription-list';

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
