import { DEFAULT_RULE_URL } from '@/config/constants';
import { fetchRuleFilterOptions } from '@/server/rules';

import { HomePageClient } from './HomePageClient';

export default async function Home() {
  let initialFilterOptions: string[] = [];
  try {
    initialFilterOptions = await fetchRuleFilterOptions(DEFAULT_RULE_URL);
  } catch (error) {
    console.error('Failed to preload home rule filter options:', error);
  }

  return <HomePageClient initialFilterOptions={initialFilterOptions} />;
}
