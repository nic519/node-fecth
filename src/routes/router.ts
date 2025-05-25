import { RouteHandler } from '@/routes/types';
import { Routes } from '@/routes/routesConfig';
import { StorageHandler } from '@/routes/handler/storageHandler';
import { KvHandler } from '@/routes/handler/kvHandler';
import { SubscriptionHandler } from '@/routes/handler/subHandler';
import { SubHandlerFast } from './handler/subHandlerFast';

export class Router {
    private handlers: Map<string, RouteHandler> = new Map();
    
    constructor() {
        this.registerHandlers();
    }
    
    private registerHandlers() {
        this.handlers.set(Routes.storage, new StorageHandler());
        this.handlers.set(Routes.kv, new KvHandler());
        this.handlers.set(Routes.subscription, new SubscriptionHandler());
        this.handlers.set(Routes.subscriptionFast, new SubHandlerFast());
    }
    
    async route(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const pathname = url.pathname;
        
        console.log(`🔍 路由匹配: ${pathname}`);
        
        // 忽略 favicon.ico 和其他静态资源请求
        if (pathname === '/favicon.ico' || 
            pathname === '/robots.txt' || 
            pathname.startsWith('/static/') ||
            pathname.endsWith('.ico') ||
            pathname.endsWith('.png') ||
            pathname.endsWith('.jpg') ||
            pathname.endsWith('.gif') ||
            pathname.endsWith('.css') ||
            pathname.endsWith('.js')) {
            console.log(`🚫 忽略静态资源请求: ${pathname}`);
            return new Response('', { status: 204 }); // 返回 204 No Content
        }
        
        // 精确匹配路由
        for (const [route, handler] of this.handlers) {
            console.log(`🔍 检查路由: ${route}`);
            if (route === pathname) {
                console.log(`✅ 精确匹配路由: ${route}`);
                const response = await handler.handle(request, env);
                if (response) return response;
            }
        }
        
        // 动态路由匹配 - 普通订阅路由 (/:uid 格式)
        if (pathname !== '/' && pathname !== Routes.storage && pathname !== Routes.kv && pathname !== Routes.subscriptionFast) {
            console.log('📡 匹配普通订阅路由');
            const subscriptionHandler = this.handlers.get(Routes.subscription);
            if (subscriptionHandler) {
                const uid = pathname.slice(1);
                console.log(`👤 提取用户ID: ${uid}`);
                const response = await (subscriptionHandler as any).handle(request, env, { uid });
                if (response) return response;
            }
        }
        
        console.log('❌ 没有匹配的路由');
        return new Response('Not Found', { status: 404 });
    }
} 