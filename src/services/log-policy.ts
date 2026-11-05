const META_KEYS = new Set(['actorId', 'result', 'targetId', 'changedFields', 'sourceCount', 'successCount', 'failedCount', 'staleCount', 'nodeCount', 'contentLength', 'durationMs', 'clientName', 'ip', 'error', 'stage', 'failures', 'requestCount']);

export function redactLogText(value: string, limit = 512): string {
  return value
    .replace(/[a-z][a-z0-9+.-]*:\/\/[^\s"'<>]+/gi, '[地址已隐藏]')
    .replace(/(["']?\b(?:token|password|authorization|access[_-]?token|api[_-]?key|secret)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|(?:Bearer|Basic)\s+[^\s,;]+|[^\s,;]+)/gi, '$1"[已隐藏]"')
    .slice(0, limit);
}

export function sanitizeLogMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (!META_KEYS.has(key)) continue;
    if (typeof value === 'string') result[key] = redactLogText(value);
    else if (typeof value === 'number' && Number.isFinite(value) || typeof value === 'boolean') result[key] = value;
    else if (Array.isArray(value)) result[key] = value.slice(0, 10).filter(item => typeof item === 'string').map(item => redactLogText(item, 128));
    if (new TextEncoder().encode(JSON.stringify(result)).length > 2000) delete result[key];
  }
  return result;
}

export const LOG_CATEGORY_SQL = `CASE WHEN user_id IS NULL OR user_id = '' THEN 'system'
  WHEN level = 'audit' OR type IN ('user_update','create_user','delete_user','user_create','user_delete','template_create','template_update','template_delete','user_login','user_logout','refresh_traffic','batch_delete','batch_enable','batch_disable') THEN 'audit'
  WHEN level IN ('warn','error') THEN 'problem' ELSE 'success' END`;
