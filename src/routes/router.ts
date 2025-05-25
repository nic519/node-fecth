import { RouteHandler } from '@/routes/types';
import { Routes } from '@/routes/routesConfig';
import { StorageHandler } from '@/routes/handler/storageHandler';
import { KvHandler } from '@/routes/handler/kvHandler';
import { SubscriptionHandler } from '@/routes/handler/subscriptionHandler';

export class Router {
    private handlers: Map<string, RouteHandler> = new Map();
    
    constructor() {
        this.registerHandlers();
    }
    
    private registerHandlers() {
        this.handlers.set(Routes.storage, new StorageHandler());
        this.handlers.set(Routes.kv, new KvHandler());
        this.handlers.set(Routes.subscription, new SubscriptionHandler());
    }
    
    async route(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const pathname = url.pathname;
        
        // 精确匹配路由
        for (const [route, handler] of this.handlers) {
            if (route === pathname) {
                const response = await handler.handle(request, env);
                if (response) return response;
            }
        }
        
        // 动态路由匹配 (订阅路由)
        if (pathname !== '/' && pathname !== Routes.storage && pathname !== Routes.kv) {
            const subscriptionHandler = this.handlers.get(Routes.subscription);
            if (subscriptionHandler) {
                const uid = pathname.slice(1);
                const response = await (subscriptionHandler as any).handle(request, env, { uid });
                if (response) return response;
            }
        }
        
        return new Response('Not Found', { status: 404 });
    }
} 