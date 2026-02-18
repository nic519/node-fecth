import { createLogService } from '@/services/log-service';
import type { LogLevel } from '@/types/log';
import { safeMeta } from '@/utils/logHelper';

export const REQUEST_TIMEOUT = 30000;

type LogMeta = Record<string, unknown>;

const logService = createLogService();

function writeLog(level: LogLevel, message: string, meta?: LogMeta) {
    try {
        if (level === 'error' || level === 'warn') {
            const safe = meta ? safeMeta(meta) : undefined;
            void logService.log({
                level,
                type: 'network',
                message,
                meta: safe,
            });
        }
    } catch {
    }
}

function toMetaAndMessage(metaOrMessage: LogMeta | string, maybeMessage?: string): { meta?: LogMeta; message: string } {
    if (typeof metaOrMessage === 'string') {
        return { message: metaOrMessage };
    }
    return { meta: metaOrMessage, message: maybeMessage || '' };
}

export const logger = {
    info(metaOrMessage: LogMeta | string, maybeMessage?: string) {
        const { meta, message } = toMetaAndMessage(metaOrMessage, maybeMessage);
        if (meta) {
            console.info(message, meta);
        } else {
            console.info(message);
        }
    },
    warn(metaOrMessage: LogMeta | string, maybeMessage?: string) {
        const { meta, message } = toMetaAndMessage(metaOrMessage, maybeMessage);
        const safe = meta ? safeMeta(meta) : undefined;
        if (safe) {
            console.warn(message, safe);
        } else {
            console.warn(message);
        }
        writeLog('warn', message, safe);
    },
    error(metaOrMessage: LogMeta | string, maybeMessage?: string) {
        const { meta, message } = toMetaAndMessage(metaOrMessage, maybeMessage);
        const safe = meta ? safeMeta(meta) : undefined;
        if (safe) {
            console.error(message, safe);
        } else {
            console.error(message);
        }
        writeLog('error', message, safe);
    },
    debug(metaOrMessage: LogMeta | string, maybeMessage?: string) {
        const { meta, message } = toMetaAndMessage(metaOrMessage, maybeMessage);
        const safe = meta ? safeMeta(meta) : undefined;
        if (safe) {
            console.debug(message, safe);
        } else {
            console.debug(message);
        }
    },
};
