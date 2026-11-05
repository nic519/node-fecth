import { expect, test } from 'bun:test';

import {
	getAvailableSubscriptionProxyProviders,
	resolveSubscriptionFetchUrl,
	resolveSubscriptionProxyProvider,
} from '@/modules/user/subscription-proxy';

test('resolveSubscriptionFetchUrl uses the configured cloudflare proxy provider', () => {
	const result = resolveSubscriptionFetchUrl(
		'https://primary.example.com/sub',
		'cloudflare',
	);

	expect(result).toBe(
		'https://transfer-v.lavamusic.workers.dev/api/proxy?url=https%3A%2F%2Fprimary.example.com%2Fsub',
	);
});

test('getAvailableSubscriptionProxyProviders hides vercel when hosted on vercel', () => {
	const providers = getAvailableSubscriptionProxyProviders({
		VERCEL: '1',
	});

	expect(providers).toEqual(['cloudflare']);
});

test('resolveSubscriptionProxyProvider treats vercel as unselected on vercel hosting', () => {
	const provider = resolveSubscriptionProxyProvider(
		'vercel',
		{ VERCEL_URL: 'demo.vercel.app' },
	);

	expect(provider).toBeUndefined();
});
