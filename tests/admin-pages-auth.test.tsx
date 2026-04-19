import { afterEach, beforeEach, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';

import AdminDashboardPage from '@/app/admin/dashboard/page';
import AdminTemplatesPage from '@/app/admin/templates/page';
import AdminUsersPage from '@/app/admin/users/page';

const originalSuperAdminToken = process.env.SUPER_ADMIN_TOKEN;

beforeEach(() => {
  process.env.SUPER_ADMIN_TOKEN = 'real-admin-token';
});

afterEach(() => {
  if (originalSuperAdminToken === undefined) {
    Reflect.deleteProperty(process.env, 'SUPER_ADMIN_TOKEN');
  } else {
    process.env.SUPER_ADMIN_TOKEN = originalSuperAdminToken;
  }
});

test('admin dashboard rejects an invalid superToken', async () => {
  const page = await AdminDashboardPage({
    searchParams: Promise.resolve({ superToken: 'anything-goes' }),
  });

  const markup = renderToStaticMarkup(page);
  expect(markup).toContain('管理员令牌无效');
  expect(markup).toContain('返回首页');
});

test('admin users page renders the shared invalid token state', async () => {
  const page = await AdminUsersPage({
    searchParams: Promise.resolve({ superToken: 'anything-goes' }),
  });

  const markup = renderToStaticMarkup(page);
  expect(markup).toContain('管理员令牌无效');
  expect(markup).toContain('返回首页');
});

test('admin templates page renders the shared invalid token state', async () => {
  const page = await AdminTemplatesPage({
    searchParams: Promise.resolve({ superToken: 'anything-goes' }),
  });

  const markup = renderToStaticMarkup(page);
  expect(markup).toContain('管理员令牌无效');
  expect(markup).toContain('返回首页');
});
