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

test('setSubscriptionList preserves an empty subscription while editing', () => {
  const config: UserConfig = {
    accessToken: 'token',
    appendSubList: [],
  };

  expect(setSubscriptionList(config, [
    { subscribe: '', flag: 'A', includeArea: [] },
  ])).toEqual({
    accessToken: 'token',
    appendSubList: [
      { subscribe: '', flag: 'A', includeArea: [] },
    ],
  });
});

test('inline sources survive list normalization and JSON persistence without a URL', () => {
 const item = {type:'inline' as const,subscribe:'',flag:' A ',proxiesYaml:'- {name: node, type: direct}'};
 const config = setSubscriptionList({accessToken:'token'},[item]);
 expect(buildSubscriptionListFromConfig(JSON.parse(JSON.stringify(config)))).toEqual([{...item,flag:'A'}]);
});
