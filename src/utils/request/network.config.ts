import { createLogService } from '@/services/log-service';
import type { LogLevel } from '@/types/log';

export const REQUEST_TIMEOUT = 30000;

type LogMeta = Record<string, unknown>;

const logService = createLogService();

function writeLog(level: LogLevel, message: string, meta?: LogMeta) {
    try {
        if (level === 'error' || level === 'warn') {
            void logService.log({
                level,
                type: 'network',
                message,
                meta,
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
        if (meta) {
            console.warn(message, meta);
        } else {
            console.warn(message);
        }
        writeLog('warn', message, meta);
    },
    error(metaOrMessage: LogMeta | string, maybeMessage?: string) {
        const { meta, message } = toMetaAndMessage(metaOrMessage, maybeMessage);
        if (meta) {
            console.error(message, meta);
        } else {
            console.error(message);
        }
        writeLog('error', message, meta);
    },
    debug(metaOrMessage: LogMeta | string, maybeMessage?: string) {
        const { meta, message } = toMetaAndMessage(metaOrMessage, maybeMessage);
        if (meta) {
            console.debug(message, meta);
        } else {
            console.debug(message);
        }
    },
};

