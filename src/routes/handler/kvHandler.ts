import { RouteHandler } from '@/routes/types';
import { getUserConfig } from '@/types/types';
import { getDevConfig } from '@/config/dev-config';

export class KvHandler implements RouteHandler {
    async handle(request: Request, env: Env): Promise<Response | null> {
        const url = new URL(request.url);

        console.log('kvHandler', url);
        
        // 获取参数
        const key = url.searchParams.get('key');
        const token = url.searchParams.get('token');
        const uid = url.searchParams.get('uid');
        
        if (!key || !token || !uid) {
            return new Response('缺少必要参数: key, token, uid', { status: 400 });
        }
        
        // 检测是否为本地开发环境且KV不可用
        const isLocalDev = this.isLocalDevelopment(request);
        const kvAvailable = env.KV_BINDING && typeof env.KV_BINDING.get === 'function';
        
        if (isLocalDev && !kvAvailable) {
            console.log('🔄 本地开发环境检测到，转发到生产worker');
            return this.forwardToProductionWorker(request, key, token, uid);
        }
        
        // // 验证token
        // const userConfig = getUserConfig(env, uid);
        // if (!userConfig || token !== userConfig.ACCESS_TOKEN) {
        //     return new Response('Unauthorized', { status: 401 });
        // }
        
        try {
            // 从KV存储获取值
            const value = await env.KV_BINDING?.get(key);
            
            if (value === null) {
                return new Response('Key not found', { status: 404 });
            }
            
            return new Response(value, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        } catch (error) {
            console.error('KV获取错误:', error);
            return new Response('获取KV值时发生错误', { status: 500 });
        }
    }
    
    /**
     * 检测是否为本地开发环境
     */
    private isLocalDevelopment(request: Request): boolean {
        const url = new URL(request.url);
        return url.hostname === 'localhost' || 
               url.hostname === '127.0.0.1' || 
               url.hostname.includes('localhost') ||
               url.port === '8787';
    }
    
    /**
     * 转发请求到生产worker
     */
    private async forwardToProductionWorker(
        request: Request, 
        key: string, 
        token: string, 
        uid: string
    ): Promise<Response> {
        try {
            // 这里需要配置您的生产worker域名
            // 您可以通过环境变量或配置文件来设置
            const productionWorkerUrl = this.getProductionWorkerUrl();
            
            if (!productionWorkerUrl) {
                return new Response('生产worker URL未配置，请设置PRODUCTION_WORKER_URL环境变量', { status: 500 });
            }
            
            // 构建转发URL
            const forwardUrl = new URL('/kv', productionWorkerUrl);
            forwardUrl.searchParams.set('key', key);
            forwardUrl.searchParams.set('token', token);
            forwardUrl.searchParams.set('uid', uid);
            
            console.log(`🌐 转发请求到: ${forwardUrl.toString()}`);
            
            // 转发请求
            const response = await fetch(forwardUrl.toString(), {
                method: 'GET',
                headers: {
                    'User-Agent': 'Local-Dev-Proxy/1.0',
                    'X-Forwarded-For': 'local-development'
                }
            });
            
            // 获取响应内容
            const responseText = await response.text();
            
            console.log(`📥 生产worker响应: ${response.status} - ${responseText.substring(0, 100)}...`);
            
            // 返回相同的响应
            return new Response(responseText, {
                status: response.status,
                headers: {
                    'Content-Type': response.headers.get('Content-Type') || 'text/plain; charset=utf-8',
                    'Access-Control-Allow-Origin': '*',
                    'X-Proxy-Source': 'local-dev-forward'
                }
            });
            
        } catch (error) {
            console.error('转发到生产worker失败:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            return new Response(`转发请求失败: ${errorMessage}`, { status: 500 });
        }
    }
    
    /**
     * 获取生产worker URL
     */
    private getProductionWorkerUrl(): string | null {
        const devConfig = getDevConfig();
        
        // 如果配置中有URL，直接返回
        if (devConfig.productionWorkerUrl) {
            return devConfig.productionWorkerUrl;
        }
        
        // 可以在这里硬编码您的生产worker域名作为备选
        // 例如: return 'https://your-worker.your-subdomain.workers.dev';
        
        console.warn('⚠️  生产worker URL未配置，请在 src/config/dev-config.ts 中设置 productionWorkerUrl');
        return null;
    }
} 