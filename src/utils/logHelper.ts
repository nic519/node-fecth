
/**
 * Safely format error messages and metadata for logging to avoid log size limits.
 */

export function safeError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    // Truncate message if it's too long (e.g. 1KB)
    if (message.length > 1024) {
        return message.slice(0, 1024) + '... (truncated)';
    }
    return message;
}

export function safeString(str: string, maxLength = 1024): string {
    if (str.length > maxLength) {
        return str.slice(0, maxLength) + '... (truncated)';
    }
    return str;
}

export function safeMeta(meta: Record<string, unknown>): Record<string, unknown> {
    const safe: Record<string, unknown> = {};
    try {
        for (const [key, value] of Object.entries(meta)) {
            if (typeof value === 'string') {
                safe[key] = safeString(value);
            } else if (value instanceof Error) {
                safe[key] = {
                    message: safeError(value),
                    stack: safeString(value.stack || '', 2048),
                };
            } else if (typeof value === 'object' && value !== null) {
                // Simple shallow check for large objects
                try {
                    const str = JSON.stringify(value);
                    if (str.length > 2048) {
                        safe[key] = str.slice(0, 2048) + '... (truncated object)';
                    } else {
                        safe[key] = value;
                    }
                } catch {
                    safe[key] = '[Circular or Unserializable Object]';
                }
            } else {
                safe[key] = value;
            }
        }
    } catch {
        safe['log_error'] = 'Failed to sanitize meta';
    }
    return safe;
}
