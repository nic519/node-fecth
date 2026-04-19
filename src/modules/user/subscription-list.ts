import { DEFAULT_SUB_FLAG } from '@/config/constants';

import type { UserConfig } from './user.schema';

type SubscriptionItem = NonNullable<UserConfig['appendSubList']>[number];

function normalizeSubscriptionItem(item: SubscriptionItem, preserveEmptySubscribe = false): SubscriptionItem | null {
  const subscribe = item.subscribe.trim();
  if (!subscribe && !preserveEmptySubscribe) {
    return null;
  }

  return {
    ...item,
    subscribe,
    flag: typeof item.flag === 'string' ? item.flag.trim() : DEFAULT_SUB_FLAG,
  };
}

export function buildSubscriptionListFromConfig(
  config: Pick<UserConfig, 'appendSubList'>,
): SubscriptionItem[] {
  return (config.appendSubList ?? [])
    .map((item) => normalizeSubscriptionItem(item))
    .filter((item): item is SubscriptionItem => item !== null);
}

export function setSubscriptionList(config: UserConfig, appendSubList: SubscriptionItem[]): UserConfig {
  const normalizedList = appendSubList
    .map((item) => normalizeSubscriptionItem(item, true))
    .filter((item): item is SubscriptionItem => item !== null);

  return {
    ...config,
    appendSubList: normalizedList,
  };
}
