import 'server-only';

function hasProcessRuntimeEnv() {
  return Boolean(
    process.env.TURSO_DATABASE_URL ||
    process.env.SUPER_ADMIN_TOKEN ||
    process.env.TURSO_AUTH_TOKEN,
  );
}

export function resolveRuntimeEnv(explicitEnv?: Env): Env | undefined {
  if (explicitEnv) {
    return explicitEnv;
  }

  const cloudflareContext = (globalThis as Record<PropertyKey, unknown>)[Symbol.for('__cloudflare-context__')] as
    | { env?: Env }
    | undefined;

  if (cloudflareContext?.env) {
    return cloudflareContext.env;
  }

  if (hasProcessRuntimeEnv()) {
    return process.env as unknown as Env;
  }

  return undefined;
}

export function getRuntimeValue(key: string, explicitEnv?: Env): string | undefined {
  const runtimeEnv = resolveRuntimeEnv(explicitEnv);
  const runtimeValue = (runtimeEnv as Record<string, unknown> | undefined)?.[key];

  if (typeof runtimeValue === 'string' && runtimeValue.length > 0) {
    return runtimeValue;
  }

  const processValue = process.env[key];
  if (typeof processValue === 'string' && processValue.length > 0) {
    return processValue;
  }

  return undefined;
}

export function getSuperAdminToken(explicitEnv?: Env): string | undefined {
  return getRuntimeValue('SUPER_ADMIN_TOKEN', explicitEnv);
}
