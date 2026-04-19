import { afterEach, beforeEach, expect, test } from 'bun:test';

import { getValidSuperAdminToken } from '@/server/auth';

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

test('getValidSuperAdminToken rejects arbitrary admin page tokens', () => {
  expect(getValidSuperAdminToken(undefined)).toBeNull();
  expect(getValidSuperAdminToken('wrong-token')).toBeNull();
  expect(getValidSuperAdminToken(['wrong-token', 'real-admin-token'])).toBeNull();
});

test('getValidSuperAdminToken returns the matching admin token', () => {
  expect(getValidSuperAdminToken('real-admin-token')).toBe('real-admin-token');
  expect(getValidSuperAdminToken(['real-admin-token'])).toBe('real-admin-token');
});
