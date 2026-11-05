import { expect, mock, test } from 'bun:test';

import AdminDashboardPage from '@/app/admin/dashboard/page';
import AdminUsersPage from '@/app/admin/users/page';
import AdminTemplatesPage from '@/app/admin/templates/page';
import AdminAnalyticsPage from '@/app/admin/analytics/page';
import AdminSourcesPage from '@/app/admin/sources/page';
import AdminLogsPage from '@/app/admin/logs/page';
import { adminReturnPath } from '@/server/admin-page';

mock.module('next/headers', () => ({
  cookies: async () => new Map(),
}));

test.each([
  [AdminDashboardPage, '/admin/dashboard'],
  [AdminUsersPage, '/admin/users'],
  [AdminTemplatesPage, '/admin/templates'],
  [AdminAnalyticsPage, '/admin/analytics'],
  [AdminSourcesPage, '/admin/sources'],
  [AdminLogsPage, '/admin/logs'],
] as const)('%p redirects to login before loading protected data', async (page, path) => {
  try {
    await page();
    throw new Error('Expected redirect');
  } catch (error) {
    expect(error).toHaveProperty('digest', `NEXT_REDIRECT;replace;/admin/login?next=${encodeURIComponent(path)};307;`);
  }
});

test('login only returns to a known admin page', () => {
  expect(adminReturnPath('/admin/templates')).toBe('/admin/templates');
  expect(adminReturnPath('//outside.test/admin/templates')).toBe('/admin/dashboard');
  expect(adminReturnPath('/admin/login')).toBe('/admin/dashboard');
});
