import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConfigForm } from '@/app/config/components/ConfigForm';
import { PanelUsageAnalytics } from '@/app/config/components/PanelUsageAnalytics';
import type { UserConfig } from '@/types/user-config';

const inlineSource = {
  type: 'inline' as const,
  subscribe: '',
  flag: '手动节点',
  proxiesYaml: 'proxies:\n  - {name: 香港 01, type: trojan, server: private.example.com, port: 443, password: PRIVATE_PASSWORD}\n  - {name: 日本 02, type: ss, server: private.example.com, port: 443, password: PRIVATE_PASSWORD}',
};

function renderAnalysis(appendSubList: UserConfig['appendSubList']) {
  return renderToStaticMarkup(
    <ConfigForm config={{ accessToken: 'token', appendSubList }} onChange={() => {}} activeTab="dynamic" availableProxyProviders={[]} />,
  );
}

test('direct node lists show their nodes without claiming the account has no sources or exposing credentials', () => {
  const markup = renderAnalysis([inlineSource]);
  expect(markup).toContain('直接节点列表');
  expect(markup).toContain('手动节点');
  expect(markup.replace(/<[^>]*>/g, '')).toContain('2 个节点');
  expect(markup).toContain('香港 01');
  expect(markup).toContain('日本 02');
  expect(markup).toContain('TROJAN');
  expect(markup).toContain('SS');
  expect(markup).toContain('本账号的 IP 与连续心跳');
  expect(markup).not.toContain('暂无订阅源');
  expect(markup).not.toContain('0 个链接订阅源');
  expect(markup).not.toContain('预更新');
  expect(markup).not.toContain('private.example.com');
  expect(markup).not.toContain('PRIVATE_PASSWORD');
});

test('mixed sources retain remote sync controls and show every direct node list', () => {
  const markup = renderAnalysis([
    inlineSource,
    { subscribe: 'https://example.com/sub', flag: '远程订阅' },
    { ...inlineSource, flag: '备用节点', proxiesYaml: '- {name: 备用直连, type: direct}' },
  ]);
  expect(markup).toContain('远程订阅');
  expect(markup).toContain('可单独预更新');
  expect(markup).toContain('手动节点');
  expect(markup).toContain('备用节点');
  expect(markup).toContain('备用直连');
  expect(markup).not.toContain('暂无订阅源');
});

test('only accounts without any sources show the source empty state', () => {
  const markup = renderAnalysis([]);
  expect(markup).toContain('尚未添加节点来源');
  expect(markup).not.toContain('直接节点列表');
});

test('invalid and unfinished direct node lists stay visible with a repair hint', () => {
  for (const proxiesYaml of ['', 'proxies: [PRIVATE_PASSWORD']) {
    const markup = renderAnalysis([{ ...inlineSource, proxiesYaml }]);
    expect(markup).toContain('直接节点列表');
    expect(markup).toContain('基础配置');
    expect(markup).toContain('role="alert"');
    expect(markup).not.toContain('尚未添加节点来源');
    expect(markup).not.toContain('PRIVATE_PASSWORD');
  }
});

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
