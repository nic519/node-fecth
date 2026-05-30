import {
	SUBSCRIPTION_PROXY_PROVIDERS,
	SUBSCRIPTION_PROXY_PROVIDER_PREFIXES,
	type SubscriptionProxyProvider,
} from '@/config/subscription-proxy.config';
import { getRuntimeValue } from '@/server/runtime';

function isVercelHosting(explicitEnv?: Env): boolean {
	return Boolean(
		getRuntimeValue('VERCEL', explicitEnv) ||
		getRuntimeValue('VERCEL_ENV', explicitEnv) ||
		getRuntimeValue('VERCEL_URL', explicitEnv),
	);
}

export function getAvailableSubscriptionProxyProviders(explicitEnv?: Env): SubscriptionProxyProvider[] {
	if (isVercelHosting(explicitEnv)) {
		return SUBSCRIPTION_PROXY_PROVIDERS.filter((provider) => provider !== 'vercel');
	}

	return [...SUBSCRIPTION_PROXY_PROVIDERS];
}

export function resolveSubscriptionProxyProvider(
	proxyProvider: SubscriptionProxyProvider | undefined,
	explicitEnv?: Env,
): SubscriptionProxyProvider | undefined {
	if (!proxyProvider) {
		return undefined;
	}

	return getAvailableSubscriptionProxyProviders(explicitEnv).includes(proxyProvider)
		? proxyProvider
		: undefined;
}

export function resolveSubscriptionFetchUrl(
	sourceUrl: string,
	proxyProvider?: SubscriptionProxyProvider,
	explicitEnv?: Env,
): string {
	const effectiveProvider = resolveSubscriptionProxyProvider(proxyProvider, explicitEnv);

	if (!effectiveProvider) {
		return sourceUrl;
	}

	return `${SUBSCRIPTION_PROXY_PROVIDER_PREFIXES[effectiveProvider]}${encodeURIComponent(sourceUrl)}`;
}
