import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { SyncItemCard } from '@/components/SyncItemCard';

test('SyncItemCard renders proxy provider controls in subscription loading view', () => {
  const markup = renderToStaticMarkup(
    <SyncItemCard
      item={{
        url: 'https://primary.example.com/sub',
        source: '订阅源',
        flag: 'A',
        proxyProvider: 'cloudflare',
      }}
      status={{ status: 'idle' }}
      availableProxyProviders={['cloudflare', 'vercel']}
    />,
  );

  expect(markup).toContain('应急访问');
  expect(markup).toContain('sync-proxy-provider-A');
  expect(markup).toContain('subscription-proxy-help');
  expect(markup).toContain('CF');
});
