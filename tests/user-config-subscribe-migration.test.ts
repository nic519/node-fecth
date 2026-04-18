import { expect, test } from 'bun:test';

import { DEFAULT_SUB_FLAG } from '@/config/constants';
import { mergeLegacySubscribeIntoAppendSubList } from '@/modules/user/legacy-subscription-migration';

test('migrates legacy config.subscribe into appendSubList when list is empty', () => {
  const migrated = mergeLegacySubscribeIntoAppendSubList({
    config: {
      subscribe: 'https://legacy.example.com/sub',
    },
    appendSubList: '',
  });

  expect(migrated).toEqual([
    {
      subscribe: 'https://legacy.example.com/sub',
      flag: DEFAULT_SUB_FLAG,
    },
  ]);
});

test('does not duplicate legacy subscribe when appendSubList already contains the same URL', () => {
  const migrated = mergeLegacySubscribeIntoAppendSubList({
    config: {
      subscribe: 'https://legacy.example.com/sub',
    },
    appendSubList: JSON.stringify([
      {
        subscribe: 'https://legacy.example.com/sub',
        flag: 'A',
      },
    ]),
  });

  expect(migrated).toEqual([
    {
      subscribe: 'https://legacy.example.com/sub',
      flag: 'A',
    },
  ]);
});

test('prepends legacy subscribe when appendSubList already has other subscriptions', () => {
  const migrated = mergeLegacySubscribeIntoAppendSubList({
    config: {
      subscribe: 'https://legacy.example.com/sub',
    },
    appendSubList: JSON.stringify([
      {
        subscribe: 'https://extra.example.com/sub',
        flag: 'B',
      },
    ]),
  });

  expect(migrated).toEqual([
    {
      subscribe: 'https://legacy.example.com/sub',
      flag: DEFAULT_SUB_FLAG,
    },
    {
      subscribe: 'https://extra.example.com/sub',
      flag: 'B',
    },
  ]);
});
