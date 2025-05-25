/**
 * 开发环境配置
 */

export interface DevConfig {
    /** 生产worker的完整URL */
    productionWorkerUrl?: string;
    /** 是否启用转发功能 */
    enableForwarding?: boolean;
}

/**
 * 默认开发配置
 * 请根据您的实际情况修改这些配置
 */
const DEFAULT_DEV_CONFIG: DevConfig = {
    // 替换为您的实际生产worker域名
    productionWorkerUrl: 'https://node.1024.hair',
    enableForwarding: true
};

/**
 * 获取开发配置
 */
export function getDevConfig(): DevConfig {
    return DEFAULT_DEV_CONFIG;
}

/**
 * 使用说明：
 * 
 * 1. 修改 DEFAULT_DEV_CONFIG 中的 productionWorkerUrl 为您的实际worker域名
 * 2. 根据需要调整其他配置选项
 * 3. 如果需要动态配置，可以在 getDevConfig 函数中添加环境变量读取逻辑
 */ 