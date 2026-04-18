import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { PanelBasicConfig } from '@/app/config/components/PanelBasicConfig';
import type { UserConfig } from '@/types/user-config';

test('PanelBasicConfig uses subscription sources as the only subscription entry UI', () => {
  const config: UserConfig = {
    subscribe: 'https://primary.example.com/sub',
    accessToken: 'token',
    appendSubList: [
      { subscribe: 'https://primary.example.com/sub', flag: 'A' },
      { subscribe: 'https://secondary.example.com/sub', flag: 'B' },
    ],
  };

  const markup = renderToStaticMarkup(
    <PanelBasicConfig config={config} onChange={() => {}} uid="demo-user" />,
  );

  expect(markup).toContain('订阅源');
  expect(markup).not.toContain('主订阅地址');
  expect(markup).not.toContain('追加订阅列表');
});
