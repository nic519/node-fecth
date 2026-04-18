import { AdminTemplatesClient } from './AdminTemplatesClient';

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ superToken?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawSuperToken = params.superToken;
  const superToken = Array.isArray(rawSuperToken) ? rawSuperToken[0] : rawSuperToken;

  return <AdminTemplatesClient superToken={superToken ?? ''} />;
}
