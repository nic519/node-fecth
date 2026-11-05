import 'server-only';

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { getSuperAdminToken } from '@/server/runtime';

export const adminSessionCookie = 'nodefetch_admin';
export const adminSessionSeconds = 12 * 60 * 60;

function hash(value: string) {
  return createHash('sha256').update(value).digest();
}

export function matchesAdminPassword(value: string, password: string): boolean {
  return timingSafeEqual(hash(value), hash(password));
}

function sign(payload: string, password: string): string {
  return createHmac('sha256', password).update(`nodefetch-admin:${payload}`).digest('base64url');
}

export function createAdminSession(password: string): string {
  const expires = Math.floor(Date.now() / 1000) + adminSessionSeconds;
  const payload = `${expires}.${randomBytes(16).toString('hex')}`;
  return `${payload}.${sign(payload, password)}`;
}

export function isValidAdminSession(token: string | undefined): boolean {
  const password = getSuperAdminToken();
  if (!password || !token) return false;

  const [expires, nonce, signature, extra] = token.split('.');
  if (extra !== undefined || !/^\d+$/.test(expires) || !nonce || !signature) return false;
  if (Number(expires) <= Date.now() / 1000) return false;

  return matchesAdminPassword(signature, sign(`${expires}.${nonce}`, password));
}

export function isCrossOriginAdminWrite(request: Request): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return false;
  if (request.headers.get('sec-fetch-site') === 'cross-site') return true;

  const origin = request.headers.get('origin');
  if (!origin) return false;

  const url = new URL(request.url);
  // Next.js can normalize the request URL to localhost.
  const host = request.headers.get('host');
  if (host) url.host = host;
  return origin !== url.origin;
}
