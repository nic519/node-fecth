import { ConfigPageClient, MissingUidState } from './ConfigPageClient';
import { createServerServices } from '@/server/services';
import type { UserConfig } from '@/types/user-config';

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

  let initialConfig: UserConfig | null = null;
  let initialLastSaved: Date | null = null;

  if (token) {
    const userConfig = await createServerServices().userService.validateAndGetUser(uid, token);
    if (userConfig) {
      const { updatedAt, ...config } = userConfig;
      initialConfig = config;
      initialLastSaved = updatedAt ? new Date(updatedAt) : null;
    }
  }

  return (
    <ConfigPageClient
      uid={uid}
      token={token ?? ''}
      initialConfig={initialConfig}
      initialLastSaved={initialLastSaved}
    />
  );
}
