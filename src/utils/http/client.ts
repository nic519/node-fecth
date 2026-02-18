import ky, { Options } from 'ky';
import { logger } from '@/utils/request/network.config';

// ==================== HTTP Client Configuration ====================

/**
 * 创建统一的 HTTP 客户端实例
 * 基于 ky 库，提供自动重试、超时控制和统一的错误处理
 */
export const httpClient = ky.create({
    timeout: 10000, // 默认 10 秒超时，适应 Worker 环境
    retry: {
        limit: 2, // 默认重试 1 次，快速失败
        methods: ['get'], // 只对 GET 请求重试
        statusCodes: [408, 413, 429, 500, 502, 503, 504], // 对这些状态码重试
        backoffLimit: 3000, // 最大退避时间 3 秒
    },
    headers: {
        'User-Agent': 'clash.meta', // 模拟 Clash 客户端
        'Accept': 'text/plain, text/yaml, application/x-yaml, */*',
    },
    hooks: {
        beforeRetry: [
            ({ request, error, retryCount }) => {
                logger.warn({
                    url: request.url,
                    error: error.message,
                    retryCount
                }, '请求失败，正在重试...');
            }
        ]
    }
});

/**
 * 发起带有重试和超时的 GET 请求
 * @param url 请求地址
 * @param options ky 选项
 */
export async function fetchWithRetry(url: string, options?: Options) {
    const startTime = Date.now();
    try {
        const response = await httpClient.get(url, options);
        const duration = Date.now() - startTime;

        logger.info({
            url,
            status: response.status,
            duration: `${duration}ms`
        }, '网络请求成功');

        return response;
    } catch (error: any) {
        const duration = Date.now() - startTime;
        logger.error({
            url,
            error: error.message,
            duration: `${duration}ms`
        }, '网络请求失败');
        throw error;
    }
}

// ==================== Concurrency Control ====================

/**
 * 简单的并发限制器 (p-limit 简化版)
 * @param concurrency 最大并发数
 * @returns 执行函数
 */
export function createConcurrencyLimit(concurrency: number) {
    const queue: (() => void)[] = [];
    let activeCount = 0;

    const next = () => {
        activeCount--;
        if (queue.length > 0) {
            const job = queue.shift();
            if (job) job();
        }
    };

    const run = async <T>(fn: () => Promise<T>): Promise<T> => {
        const execute = async (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => {
            activeCount++;
            try {
                const result = await fn();
                resolve(result);
            } catch (err) {
                reject(err);
            } finally {
                next();
            }
        };

        if (activeCount < concurrency) {
            return new Promise((resolve, reject) => execute(resolve, reject));
        }

        return new Promise((resolve, reject) => {
            queue.push(() => execute(resolve, reject));
        });
    };

    return run;
}

// ==================== Remote Content Fetcher ====================

/**
 * 从远程URL获取原始内容（用于获取规则等）
 * @param url 远程URL
 * @param retries 重试次数，默认为 1
 * @returns 内容文本
 */
export async function fetchRawContent(url: string, retries = 1): Promise<string> {
    try {
        logger.info({ url }, '获取远程原始内容');

        const response = await httpClient.get(url, {
            retry: retries,
            headers: {
                'User-Agent': 'clash.meta',
                Accept: 'text/plain, text/yaml, application/x-yaml, */*',
                'Accept-Encoding': 'gzip, deflate, br',
                Connection: 'keep-alive',
            },
        });

        const content = await response.text();
        return content;
    } catch (error: any) {
        logger.error({ url, error: error.message }, '获取原始内容失败');
        throw error;
    }
}
