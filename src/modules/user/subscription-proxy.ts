import {
	SUBSCRIPTION_PROXY_PROVIDERS,
	SUBSCRIPTION_PROXY_PROVIDER_PREFIXES,
	type SubscriptionProxyProvider,
} from '@/config/subscription-proxy.config';
import { getRuntimeValue } from '@/server/runtime';

function isVercelHosting(explicitEnv?: NodeJS.ProcessEnv): boolean {
	return Boolean(
		getRuntimeValue('VERCEL', explicitEnv) ||
		getRuntimeValue('VERCEL_ENV', explicitEnv) ||
		getRuntimeValue('VERCEL_URL', explicitEnv),
	);
}

export function getAvailableSubscriptionProxyProviders(explicitEnv?: NodeJS.ProcessEnv): SubscriptionProxyProvider[] {
	if (isVercelHosting(explicitEnv)) {
		return SUBSCRIPTION_PROXY_PROVIDERS.filter((provider) => provider !== 'vercel');
	}

	return [...SUBSCRIPTION_PROXY_PROVIDERS];
}

export function resolveSubscriptionProxyProvider(
	proxyProvider: SubscriptionProxyProvider | undefined,
	explicitEnv?: NodeJS.ProcessEnv,
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
	explicitEnv?: NodeJS.ProcessEnv,
): string {
	const effectiveProvider = resolveSubscriptionProxyProvider(proxyProvider, explicitEnv);

	if (!effectiveProvider) {
		return sourceUrl;
	}

	return `${SUBSCRIPTION_PROXY_PROVIDER_PREFIXES[effectiveProvider]}${encodeURIComponent(sourceUrl)}`;
}
