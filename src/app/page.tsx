import { redirect } from 'next/navigation';

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

  return <HomePageClient />;
}
