import { RouteHandler } from '@/routes/types';
import { getUserConfig } from '@/types/types';
import { getDevConfig } from '@/config/dev-config';

export class KvHandler implements RouteHandler {
    async handle(request: Request, env: Env): Promise<Response | null> {
        const url = new URL(request.url);
        console.log('kvHandler', url, request.method);
        
        // 检测是否为本地开发环境且KV不可用
        const isLocalDev = this.isLocalDevelopment(request);
        const kvAvailable = env.KV_BINDING && typeof env.KV_BINDING.get === 'function';
        
        if (isLocalDev && !kvAvailable) {
            console.log('🔄 本地开发环境检测到，转发到生产worker');
            return this.forwardToProductionWorker(request);
        }

        // 根据请求方法处理不同的操作
        if (request.method === 'GET') {
            return this.handleGet(request, env);
        } else if (request.method === 'POST') {
            return this.handlePost(request, env);
        } else {
            return new Response('Method not allowed', { status: 405 });
        }
    }

    private async handleGet(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        
        // 获取参数
        const key = url.searchParams.get('key');
        const token = url.searchParams.get('token');
        const uid = url.searchParams.get('uid');
        
        if (!key) {
            return new Response('缺少必要参数: key', { status: 400 });
        }
        
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

    private async handlePost(request: Request, env: Env): Promise<Response> {
        try {
            // 解析请求体
            const body = await request.json() as {
                key: string;
                value: string;
                uid?: string;
                token?: string;
            };
            
            const { key, value } = body;
            
            if (!key || !value) {
                return new Response('缺少必要参数: key, value', { status: 400 });
            }
            
            // 检查KV是否可用
            if (!env.KV_BINDING || typeof env.KV_BINDING.put !== 'function') {
                return new Response('KV存储不可用', { status: 500 });
            }
            
            // 存储到KV
            await env.KV_BINDING.put(key, value);
            
            console.log(`✅ KV PUT成功: ${key}`);
            
            return new Response('OK', {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        } catch (error) {
            console.error('KV PUT错误:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            return new Response(`KV存储失败: ${errorMessage}`, { status: 500 });
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
    private async forwardToProductionWorker(request: Request): Promise<Response> {
        try {
            const productionWorkerUrl = this.getProductionWorkerUrl();
            
            if (!productionWorkerUrl) {
                return new Response('生产worker URL未配置，请设置PRODUCTION_WORKER_URL环境变量', { status: 500 });
            }
            
            // 构建转发URL
            const forwardUrl = new URL('/kv', productionWorkerUrl);
            const originalUrl = new URL(request.url);
            
            // 复制所有查询参数
            originalUrl.searchParams.forEach((value, key) => {
                forwardUrl.searchParams.set(key, value);
            });
            
            console.log(`🌐 转发请求到: ${forwardUrl.toString()}`);
            
            // 转发请求
            const response = await fetch(forwardUrl.toString(), {
                method: request.method,
                headers: {
                    'User-Agent': 'Local-Dev-Proxy/1.0',
                    'X-Forwarded-For': 'local-development',
                    'Content-Type': request.headers.get('Content-Type') || 'application/json'
                },
                body: request.method === 'POST' ? await request.text() : undefined
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
        
        console.warn('⚠️  生产worker URL未配置，请在 src/config/dev-config.ts 中设置 productionWorkerUrl');
        return null;
    }
} 