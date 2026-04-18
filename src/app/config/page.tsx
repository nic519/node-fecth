import { ConfigPageClient, MissingUidState } from './ConfigPageClient';

export default async function UserConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string | string[]; token?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawUid = params.uid;
  const rawToken = params.token;
  const uid = Array.isArray(rawUid) ? rawUid[0] : rawUid;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  if (!uid) {
    return <MissingUidState />;
  }

  return <ConfigPageClient uid={uid} token={token ?? ''} />;
}
