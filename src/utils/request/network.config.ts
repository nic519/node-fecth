import { createModuleLogger } from '@/utils/logger';

// ==================== 日志记录器 ====================

export const logger = createModuleLogger('ProxyFetch');

// ==================== 常量定义 ====================

/** 请求超时时间：20秒 */
export const REQUEST_TIMEOUT = 20000;
