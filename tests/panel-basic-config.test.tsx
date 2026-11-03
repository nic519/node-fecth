import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { PanelBasicConfig } from '@/app/config/components/PanelBasicConfig';
import type { UserConfig } from '@/types/user-config';

test('PanelBasicConfig uses subscription sources as the only subscription entry UI', () => {
  const config: UserConfig = {
    accessToken: 'token',
    appendSubList: [
      { subscribe: 'https://primary.example.com/sub', flag: 'A' },
      { subscribe: 'https://secondary.example.com/sub', flag: 'B' },
    ],
  };

  const markup = renderToStaticMarkup(
    <PanelBasicConfig
      config={config}
      onChange={() => {}}
      uid="demo-user"
    />,
  );

  expect(markup).toContain('订阅源');
  expect(markup).not.toContain('主订阅地址');
  expect(markup).not.toContain('追加订阅列表');
});

test('PanelBasicConfig renders empty subscription rows while editing', () => {
  const config: UserConfig = {
    accessToken: 'token',
    appendSubList: [
      { subscribe: '', flag: 'A', includeArea: [] },
    ],
  };

  const markup = renderToStaticMarkup(
    <PanelBasicConfig
      config={config}
      onChange={() => {}}
      uid="demo-user"
    />,
  );

  expect(markup).toContain('sub-url-0');
  expect(markup).toContain('sub-flag-0');
  expect(markup).not.toContain('订阅代理');
});

test('inline subscription editor shows YAML and node count instead of a URL field', () => {
 const markup = renderToStaticMarkup(<PanelBasicConfig config={{accessToken:'token',appendSubList:[{type:'inline',subscribe:'',flag:'A',proxiesYaml:'- {name: node, type: direct}'}]}} onChange={()=>{}} />);
 expect(markup).toContain('sub-proxies-0');
 expect(markup).toContain('已识别 1 个节点');
 expect(markup).not.toContain('sub-url-0');
 expect(markup).toContain('重新粘贴并保存');
});
