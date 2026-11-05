import 'server-only';

function hasProcessRuntimeEnv() {
  return Boolean(
    process.env.TURSO_DATABASE_URL ||
    process.env.SUPER_ADMIN_TOKEN ||
    process.env.TURSO_AUTH_TOKEN,
  );
}

export function resolveRuntimeEnv(explicitEnv?: NodeJS.ProcessEnv): NodeJS.ProcessEnv | undefined {
  if (explicitEnv) {
    return explicitEnv;
  }

  if (hasProcessRuntimeEnv()) {
    return process.env;
  }

  return undefined;
}

export function getRuntimeValue(key: string, explicitEnv?: NodeJS.ProcessEnv): string | undefined {
  const runtimeEnv = resolveRuntimeEnv(explicitEnv);
  const runtimeValue = runtimeEnv?.[key];

  if (typeof runtimeValue === 'string' && runtimeValue.length > 0) {
    return runtimeValue;
  }

  const processValue = process.env[key];
  if (typeof processValue === 'string' && processValue.length > 0) {
    return processValue;
  }

  return undefined;
}

export function getSuperAdminToken(explicitEnv?: NodeJS.ProcessEnv): string | undefined {
  return getRuntimeValue('SUPER_ADMIN_TOKEN', explicitEnv);
}
