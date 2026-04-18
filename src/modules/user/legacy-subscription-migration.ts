import { DEFAULT_SUB_FLAG } from '@/config/constants';

type LegacyConfig = {
  subscribe?: unknown;
};

type LegacyAppendSubItem = {
  subscribe?: unknown;
  flag?: unknown;
  includeArea?: unknown;
};

type MigrationInput = {
  config?: LegacyConfig | null;
  appendSubList?: string | null;
};

type AppendSubItem = {
  subscribe: string;
  flag: string;
  includeArea?: string[];
};

function normalizeSubscriptionItem(item: LegacyAppendSubItem): AppendSubItem | null {
  if (typeof item.subscribe !== 'string') {
    return null;
  }

  const subscribe = item.subscribe.trim();
  if (!subscribe) {
    return null;
  }

  const normalized: AppendSubItem = {
    subscribe,
    flag: typeof item.flag === 'string' && item.flag.trim() ? item.flag.trim() : DEFAULT_SUB_FLAG,
  };

  if (Array.isArray(item.includeArea)) {
    normalized.includeArea = item.includeArea.filter((area): area is string => typeof area === 'string');
  }

  return normalized;
}

function parseAppendSubList(raw: string | null | undefined): AppendSubItem[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => (typeof item === 'object' && item !== null ? normalizeSubscriptionItem(item as LegacyAppendSubItem) : null))
      .filter((item): item is AppendSubItem => item !== null);
  } catch {
    return [];
  }
}

export function mergeLegacySubscribeIntoAppendSubList(input: MigrationInput): AppendSubItem[] {
  const subscriptions = parseAppendSubList(input.appendSubList);
  const legacySubscribe = typeof input.config?.subscribe === 'string' ? input.config.subscribe.trim() : '';

  if (!legacySubscribe) {
    return subscriptions;
  }

  if (subscriptions.some((item) => item.subscribe === legacySubscribe)) {
    return subscriptions;
  }

  return [
    {
      subscribe: legacySubscribe,
      flag: DEFAULT_SUB_FLAG,
    },
    ...subscriptions,
  ];
}
