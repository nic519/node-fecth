import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { SyncItemCard } from '@/components/SyncItemCard';

test('SyncItemCard keeps emergency proxy controls collapsed by default', () => {
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
  expect(markup).toContain('<details');
  expect(markup).not.toMatch(/<details[^>]*\bopen(?:[ =/>])/);
  expect(markup).toContain('sync-proxy-provider-A');
  expect(markup).toContain('subscription-proxy-help');
  expect(markup).toContain('CF');
});
