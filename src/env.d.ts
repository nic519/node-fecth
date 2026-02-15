import type { D1Database, KVNamespace } from '@cloudflare/workers-types';

declare global {
  interface Env {
    DB: D1Database;
    USERS_KV: KVNamespace;
    DB_USER: string;
    SUPER_ADMIN_TOKEN: string;
    [key: string]: unknown;
  }
}
