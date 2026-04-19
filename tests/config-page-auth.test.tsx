import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';

import UserConfigPage from '@/app/config/page';

test('config page renders an invalid token state when token is missing', async () => {
  const page = await UserConfigPage({
    searchParams: Promise.resolve({ uid: 'demo-user' }),
  });

  const markup = renderToStaticMarkup(page);
  expect(markup).toContain('访问令牌无效');
  expect(markup).toContain('返回首页');
});
