import type { D1Database } from '@cloudflare/workers-types';

declare global {
  interface Env {
    DB: D1Database;
    DB_USER: string;
    SUPER_ADMIN_TOKEN: string;
    [key: string]: unknown;
  }
}
