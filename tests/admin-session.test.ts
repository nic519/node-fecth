import { afterEach, beforeEach, expect, spyOn, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { POST as login, DELETE as logout } from '@/app/api/admin/session/route';
import { withAuth } from '@/utils/apiMiddleware';

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

const adminHandler = withAuth(() => new Response(null, { status: 204 }), { adminOnly: true });

function signIn(password: string, origin = 'https://nodefetch.test') {
  return login(new Request('https://nodefetch.test/api/admin/session', {
    method: 'POST',
    headers: { origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  }));
}

function accessAdmin(cookie: string, method = 'GET', origin = 'https://nodefetch.test') {
  return adminHandler(
    new NextRequest('https://nodefetch.test/api/admin/users', {
      method,
      headers: { cookie, origin },
    }),
    { params: Promise.resolve({}) },
  );
}

test('admin API rejects the old URL credential even when it matches the password', async () => {
  const response = await adminHandler(
    new NextRequest('https://nodefetch.test/api/admin/users?superToken=real-admin-token'),
    { params: Promise.resolve({}) },
  );
  expect(response.status).toBe(401);
});

test('wrong passwords and cross-site login attempts never set a cookie', async () => {
  const wrongPassword = await signIn('wrong-password');
  expect(wrongPassword.status).toBe(401);
  expect(wrongPassword.headers.get('set-cookie')).toBeNull();

  const crossSite = await signIn('real-admin-token', 'https://other.test');
  expect(crossSite.status).toBe(403);
  expect(crossSite.headers.get('set-cookie')).toBeNull();
});

test('login issues a signed HttpOnly cookie accepted by the admin API', async () => {
  const response = await signIn('real-admin-token');
  const setCookie = response.headers.get('set-cookie') ?? '';
  expect(response.status).toBe(200);
  expect(setCookie).toContain('HttpOnly');
  expect(setCookie).toContain('SameSite=strict');
  expect(setCookie).toContain('Max-Age=43200');
  expect(setCookie).not.toContain('real-admin-token');

  const cookie = setCookie.split(';')[0];
  expect((await accessAdmin(cookie)).status).toBe(204);
  expect((await accessAdmin(`${cookie}tampered`)).status).toBe(401);
  expect((await accessAdmin(cookie, 'POST', 'https://other.test')).status).toBe(403);
  expect((await accessAdmin(cookie, 'POST', 'https://nodefetch.test')).status).toBe(204);

  process.env.SUPER_ADMIN_TOKEN = 'new-password';
  expect((await accessAdmin(cookie)).status).toBe(401);
});

test('expired admin cookies are rejected', async () => {
  const clock = spyOn(Date, 'now');
  try {
    const start = Date.now();
    clock.mockReturnValue(start);
    const response = await signIn('real-admin-token');
    const cookie = (response.headers.get('set-cookie') ?? '').split(';')[0];
    clock.mockReturnValue(start + 12 * 60 * 60 * 1000);
    expect((await accessAdmin(cookie)).status).toBe(401);
  } finally {
    clock.mockRestore();
  }
});

test('logout expires the session cookie', async () => {
  const response = await logout(new Request('https://nodefetch.test/api/admin/session', { method: 'DELETE' }));
  expect(response.headers.get('set-cookie')).toContain('nodefetch_admin=;');
  expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
});
