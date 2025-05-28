import { getDevConfig } from '../config/dev-config';
import { CommonUtils } from './commonUtils';

/**
 * KV代理服务 - 在本地开发环境中转发KV操作到生产环境
 */
export class KvProxy {
    private env: Env;
    
    constructor(env: Env) {
        this.env = env;
    }
     
    
    /**
     * 获取生产worker URL
     */
    private getProductionWorkerUrl(): string | null {
        const devConfig = getDevConfig();
        
        if (devConfig.productionWorkerUrl && devConfig.enableForwarding) {
            return devConfig.productionWorkerUrl;
        }
        
        console.warn('⚠️  生产worker URL未配置或转发功能未启用');
        return null;
    }
    
    /**
     * KV GET操作
     */
    async get(key: string, uid?: string, token?: string): Promise<string | null> {
        // 如果不是本地开发环境，直接使用KV
        if (!CommonUtils.isLocalDevelopment(this.env)) {
            return await this.env.KV_BINDING?.get(key) || null;
        }
        
        console.log(`🔄 本地开发环境 - 转发KV GET操作: ${key}`);
        
        const productionWorkerUrl = this.getProductionWorkerUrl();
        if (!productionWorkerUrl) {
            throw new Error('生产worker URL未配置，无法转发KV操作');
        }
        
        try {
            // 构建转发URL
            const forwardUrl = new URL('/kv', productionWorkerUrl);
            forwardUrl.searchParams.set('key', key);
            if (uid) forwardUrl.searchParams.set('uid', uid);
            if (token) forwardUrl.searchParams.set('token', token);
            
            console.log(`🌐 转发GET请求到: ${forwardUrl.toString()}`);
            
            const response = await fetch(forwardUrl.toString(), {
                method: 'GET',
                headers: {
                    'User-Agent': 'Local-Dev-KV-Proxy/1.0',
                    'X-Forwarded-For': 'local-development'
                }
            });
            
            if (response.status === 404) {
                return null;
            }
            
            if (!response.ok) {
                throw new Error(`KV GET转发失败: ${response.status} - ${await response.text()}`);
            }
            
            const result = await response.text();
            console.log(`📥 KV GET成功: ${key} - ${result.substring(0, 100)}...`);
            return result;
            
        } catch (error) {
            console.error('KV GET转发失败:', error);
            throw error;
        }
    }
    
    /**
     * KV PUT操作
     */
    async put(key: string, value: string, uid?: string, token?: string): Promise<void> {
        // 如果不是本地开发环境，直接使用KV
        if (!this.isLocalDevelopment()) {
            await this.env.KV_BINDING?.put(key, value);
            return;
        }
        
        console.log(`🔄 本地开发环境 - 转发KV PUT操作: ${key}`);
        
        const productionWorkerUrl = this.getProductionWorkerUrl();
        if (!productionWorkerUrl) {
            throw new Error('生产worker URL未配置，无法转发KV操作');
        }
        
        try {
            // 构建转发URL - 现在使用统一的/kv路由
            const forwardUrl = new URL('/kv', productionWorkerUrl);
            
            console.log(`🌐 转发PUT请求到: ${forwardUrl.toString()}`);
            
            const response = await fetch(forwardUrl.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Local-Dev-KV-Proxy/1.0',
                    'X-Forwarded-For': 'local-development'
                },
                body: JSON.stringify({
                    key,
                    value,
                    uid,
                    token
                })
            });
            
            if (!response.ok) {
                throw new Error(`KV PUT转发失败: ${response.status} - ${await response.text()}`);
            }
            
            console.log(`📤 KV PUT成功: ${key}`);
            
        } catch (error) {
            console.error('KV PUT转发失败:', error);
            throw error;
        }
    }
} 
 