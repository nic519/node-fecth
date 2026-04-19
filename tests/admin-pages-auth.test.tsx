import { afterEach, beforeEach, expect, test } from 'bun:test';
import type { ReactElement } from 'react';
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

  expect(renderToStaticMarkup(page)).toContain('管理员令牌无效或缺失');
});

test('admin users page does not preload data with an invalid superToken', async () => {
  const page = (await AdminUsersPage({
    searchParams: Promise.resolve({ superToken: 'anything-goes' }),
  })) as ReactElement<{ superToken: string; initialUsers: unknown[] }>;

  expect(page.props.superToken).toBe('');
  expect(page.props.initialUsers).toEqual([]);
});

test('admin templates page does not preload data with an invalid superToken', async () => {
  const page = (await AdminTemplatesPage({
    searchParams: Promise.resolve({ superToken: 'anything-goes' }),
  })) as ReactElement<{ superToken: string; initialTemplates: unknown[] }>;

  expect(page.props.superToken).toBe('');
  expect(page.props.initialTemplates).toEqual([]);
});
