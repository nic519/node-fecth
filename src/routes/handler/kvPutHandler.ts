import { RouteHandler } from '@/routes/types';
import { getUserConfig } from '@/types/types';

export class KvPutHandler implements RouteHandler {
    async handle(request: Request, env: Env): Promise<Response | null> {
        const url = new URL(request.url);

        console.log('kvPutHandler', url);
        
        // 只处理POST请求
        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }
        
        try {
            // 解析请求体
            const body = await request.json() as {
                key: string;
                value: string;
                uid?: string;
                token?: string;
            };
            
            const { key, value, uid, token } = body;
            
            if (!key || !value) {
                return new Response('缺少必要参数: key, value', { status: 400 });
            }
            
            // // 如果提供了uid和token，进行验证
            // if (uid && token) {
            //     const userConfig = getUserConfig(env, uid);
            //     if (!userConfig || token !== userConfig.ACCESS_TOKEN) {
            //         return new Response('Unauthorized', { status: 401 });
            //     }
            // }
            
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
} 