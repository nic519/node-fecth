export const SUBSCRIPTION_PROXY_PROVIDERS = ['cloudflare', 'vercel'] as const;

export type SubscriptionProxyProvider = typeof SUBSCRIPTION_PROXY_PROVIDERS[number];

export const SUBSCRIPTION_PROXY_PROVIDER_LABELS: Record<SubscriptionProxyProvider, string> = {
	cloudflare: 'Cloudflare',
	vercel: 'Vercel',
};

export const SUBSCRIPTION_PROXY_PROVIDER_SHORT_LABELS: Record<SubscriptionProxyProvider, string> = {
	cloudflare: 'CF',
	vercel: 'Vercel',
};

export const SUBSCRIPTION_PROXY_PROVIDER_PREFIXES: Record<SubscriptionProxyProvider, string> = {
	cloudflare: 'https://transfer-v.lavamusic.workers.dev/api/proxy?url=',
	vercel: 'https://transfer-v.vercel.app/api/proxy?url=',
};
