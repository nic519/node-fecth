import type { D1Database } from '@cloudflare/workers-types';

declare global {
  interface Env {
    DB: D1Database;
    SUPER_ADMIN_TOKEN: string;
    [key: string]: unknown;
  }
}
