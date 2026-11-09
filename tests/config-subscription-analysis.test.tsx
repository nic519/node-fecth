import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConfigForm } from '@/app/config/components/ConfigForm';
import { PanelUsageAnalytics } from '@/app/config/components/PanelUsageAnalytics';

const config = {
  accessToken: 'token',
  appendSubList: [{ subscribe: 'https://example.com/sub', flag: 'A' }],
};

test('subscription analysis includes sync controls and heartbeat without duplicate usage cards', () => {
  const markup = renderToStaticMarkup(
    <ConfigForm config={config} onChange={() => {}} activeTab="dynamic" uid="demo" token="token" availableProxyProviders={[]} />,
  );
  expect(markup).toContain('可单独预更新');
  expect(markup).toContain('本账号的 IP 与连续心跳');
  expect(markup).not.toContain('订阅用量分析');
});

test('expiry timeline uses the shared subscription sync snapshot', () => {
  const url = config.appendSubList[0].subscribe;
  const markup = renderToStaticMarkup(
    <PanelUsageAnalytics config={config} infos={{
      [url]: {
        id: 'source', url,
        traffic: 'upload=0; download=1024; total=2048; expire=1893456000',
        updatedAt: '2026-11-09T00:00:00Z',
      },
    }} />,
  );
  expect(markup).toContain('到期时间轴');
});
