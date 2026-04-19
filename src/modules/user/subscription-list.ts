import { DEFAULT_SUB_FLAG } from '@/config/constants';

import type { IUserConfig } from './user.schema';

type SubscriptionItem = NonNullable<IUserConfig['appendSubList']>[number];

function normalizeSubscriptionItem(item: SubscriptionItem): SubscriptionItem | null {
  const subscribe = item.subscribe.trim();
  if (!subscribe) {
    return null;
  }

  return {
    ...item,
    subscribe,
    flag: item.flag?.trim() ? item.flag.trim() : DEFAULT_SUB_FLAG,
  };
}

export function buildSubscriptionListFromConfig(
  config: Pick<IUserConfig, 'appendSubList'>,
): SubscriptionItem[] {
  return (config.appendSubList ?? [])
    .map(normalizeSubscriptionItem)
    .filter((item): item is SubscriptionItem => item !== null);
}

export function setSubscriptionList(config: IUserConfig, appendSubList: SubscriptionItem[]): IUserConfig {
  const normalizedList = appendSubList
    .map(normalizeSubscriptionItem)
    .filter((item): item is SubscriptionItem => item !== null);

  return {
    ...config,
    appendSubList: normalizedList,
  };
}
