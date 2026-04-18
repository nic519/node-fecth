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
  config: Pick<IUserConfig, 'appendSubList' | 'subscribe'>,
): SubscriptionItem[] {
  const normalizedList = (config.appendSubList ?? [])
    .map(normalizeSubscriptionItem)
    .filter((item): item is SubscriptionItem => item !== null);

  const legacySubscribe = config.subscribe?.trim();
  if (!legacySubscribe) {
    return normalizedList;
  }

  if (normalizedList.some((item) => item.subscribe === legacySubscribe)) {
    return normalizedList;
  }

  return [
    {
      subscribe: legacySubscribe,
      flag: DEFAULT_SUB_FLAG,
    },
    ...normalizedList,
  ];
}

export function getPrimarySubscriptionUrl(
  config: Pick<IUserConfig, 'appendSubList' | 'subscribe'>,
): string {
  const normalizedList = (config.appendSubList ?? [])
    .map(normalizeSubscriptionItem)
    .filter((item): item is SubscriptionItem => item !== null);

  if (normalizedList.length > 0) {
    return normalizedList[0].subscribe;
  }

  return config.subscribe?.trim() ?? '';
}

export function setPrimarySubscriptionUrl(config: IUserConfig, subscribe: string): IUserConfig {
  const nextSubscribe = subscribe.trim();
  const subscriptions = buildSubscriptionListFromConfig(config);

  let nextSubscriptions: SubscriptionItem[];
  if (!nextSubscribe) {
    nextSubscriptions = subscriptions.slice(1);
  } else if (subscriptions.length > 0) {
    nextSubscriptions = [
      {
        ...subscriptions[0],
        subscribe: nextSubscribe,
      },
      ...subscriptions.slice(1),
    ];
  } else {
    nextSubscriptions = [
      {
        subscribe: nextSubscribe,
        flag: DEFAULT_SUB_FLAG,
      },
    ];
  }

  return {
    ...config,
    subscribe: nextSubscribe,
    appendSubList: nextSubscriptions,
  };
}

export function setSubscriptionList(config: IUserConfig, appendSubList: SubscriptionItem[]): IUserConfig {
  const normalizedList = appendSubList
    .map(normalizeSubscriptionItem)
    .filter((item): item is SubscriptionItem => item !== null);

  return {
    ...config,
    subscribe: normalizedList[0]?.subscribe ?? '',
    appendSubList: normalizedList,
  };
}
