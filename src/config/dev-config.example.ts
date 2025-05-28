/**
 * 开发配置示例文件
 * 复制此文件为 dev-config.ts 并修改配置
 */

import { DevConfig } from './dev-config';

/**
 * 示例开发配置
 */
export const EXAMPLE_DEV_CONFIG: DevConfig = {
    // 生产worker的完整URL
    // 替换为您实际的worker域名
    productionWorkerUrl: 'https://node.1024.hair',
    
    // 启用转发功能
    enableForwarding: true
};

/**
 * 多环境配置示例
 */
export const MULTI_ENV_CONFIG: DevConfig = {
    // 根据环境变量选择不同的worker URL
    productionWorkerUrl: (() => {
        // 如果有环境变量，优先使用
        if (typeof globalThis !== 'undefined' && (globalThis as any).PRODUCTION_WORKER_URL) {
            return (globalThis as any).PRODUCTION_WORKER_URL;
        }
        
        // 在Cloudflare Workers环境中，可以通过其他方式判断环境
        // 这里提供一个简单的默认配置
        return 'https://prod-worker.your-subdomain.workers.dev';
    })(),
    
    enableForwarding: true
};

/**
 * 使用说明：
 * 
 * 1. 复制此文件为 dev-config.ts
 * 2. 修改 productionWorkerUrl 为您的实际worker域名
 * 3. 根据需要调整其他配置选项
 * 
 * 示例：
 * ```typescript
 * export const DEFAULT_DEV_CONFIG: DevConfig = {
 *     productionWorkerUrl: 'https://my-worker.my-subdomain.workers.dev',
 *     enableForwarding: true
 * };
 * ```
 */ 