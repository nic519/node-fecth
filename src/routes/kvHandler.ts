import { RouteHandler } from './types';
import { getUserConfig } from '@/types/types';

export class KvHandler implements RouteHandler {
    async handle(request: Request, env: Env): Promise<Response | null> {
        const url = new URL(request.url);
        
        // 获取参数
        const key = url.searchParams.get('key');
        const token = url.searchParams.get('token');
        const uid = url.searchParams.get('uid');
        
        if (!key || !token || !uid) {
            return new Response('缺少必要参数: key, token, uid', { status: 400 });
        }
        
        // 验证token
        const userConfig = getUserConfig(env, uid);
        if (!userConfig || token !== userConfig.ACCESS_TOKEN) {
            return new Response('Unauthorized', { status: 401 });
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
} 