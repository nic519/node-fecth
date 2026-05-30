import { ConfigPageClient, MissingUidState } from './ConfigPageClient';
import { AccessDeniedState } from '@/components/AccessDeniedState';
import { createServerServices } from '@/server/services';
import type { UserConfig } from '@/types/user-config';
import { getAvailableSubscriptionProxyProviders, resolveSubscriptionProxyProvider } from '@/modules/user/subscription-proxy';

function ConfigAccessDenied() {
  return (
    <AccessDeniedState
      eyebrow="配置页访问校验"
      title="访问令牌无效"
      message="当前链接无法打开该用户配置，请确认 uid 和 token 是否正确。"
    />
  );
}

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

  if (!token) {
    return <ConfigAccessDenied />;
  }

  let initialConfig: UserConfig | null = null;
  let initialLastSaved: Date | null = null;
  const availableProxyProviders = getAvailableSubscriptionProxyProviders();

  const userConfig = await createServerServices().userService.validateAndGetUser(uid, token);
  if (!userConfig) {
    return <ConfigAccessDenied />;
  }

  const { updatedAt, ...config } = userConfig;
  initialConfig = {
    ...config,
    appendSubList: config.appendSubList?.map((subscription) => ({
      ...subscription,
      proxyProvider: resolveSubscriptionProxyProvider(subscription.proxyProvider),
    })),
  };
  initialLastSaved = updatedAt ? new Date(updatedAt) : null;

  return (
    <ConfigPageClient
      uid={uid}
      token={token}
      initialConfig={initialConfig}
      initialLastSaved={initialLastSaved}
      availableProxyProviders={availableProxyProviders}
    />
  );
}
