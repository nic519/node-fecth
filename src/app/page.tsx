import { redirect } from 'next/navigation';
import { DEFAULT_RULE_URL } from '@/config/constants';
import { fetchRuleFilterOptions } from '@/server/rules';

import { HomePageClient } from './HomePageClient';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ superToken?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawSuperToken = params.superToken;
  const superToken = Array.isArray(rawSuperToken) ? rawSuperToken[0] : rawSuperToken;

  if (superToken) {
    redirect(`/admin/dashboard?superToken=${superToken}`);
  }

  let initialFilterOptions: string[] = [];
  try {
    initialFilterOptions = await fetchRuleFilterOptions(DEFAULT_RULE_URL);
  } catch (error) {
    console.error('Failed to preload home rule filter options:', error);
  }

  return <HomePageClient initialFilterOptions={initialFilterOptions} />;
}
