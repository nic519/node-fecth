import { RouteHandler } from '@/routes/routesType';
import { RoutesPath } from '@/routes/routesPath';
import { StorageHandler } from '@/routes/handler/storageHandler';
import { KvHandler } from '@/module/kv/kvHandler';
import { SubscriptionHandler } from '@/routes/handler/subHandler';
import { SubFastHandler } from './handler/subClashHandler';
import { SubRudeHandler } from './handler/subRudeHandler';
import { AuthUtils } from '@/utils/authUtils';

export class Router {
	private handlers: Map<string, RouteHandler> = new Map();

	constructor() {
		this.registerHandlers();
	}

	private registerHandlers() {
		this.handlers.set(RoutesPath.storage, new StorageHandler());
		this.handlers.set(RoutesPath.kv, new KvHandler());
		this.handlers.set(RoutesPath.subscription, new SubscriptionHandler());
		this.handlers.set(RoutesPath.subscriptionFast, new SubFastHandler());
	}

	async route(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;

		// 忽略 favicon.ico 和其他静态资源请求
		if (
			pathname === '/favicon.ico' ||
			pathname === '/robots.txt' ||
			pathname.startsWith('/static/') ||
			pathname.endsWith('.ico') ||
			pathname.endsWith('.png') ||
			pathname.endsWith('.jpg') ||
			pathname.endsWith('.gif') ||
			pathname.endsWith('.css') ||
			pathname.endsWith('.js')
		) {
			return new Response(null, { status: 204 }); // 返回 204 No Content
		}

		console.log(`🔍 路由匹配: ${pathname}`);

		// 精确匹配路由
		for (const [route, handler] of this.handlers) {
			if (route === pathname) {
				console.log(`✅ 精确匹配路由: ${route}`);
				const response = await handler.handle(request, env);
				if (response) return response;
			}
		}

		// 动态路由匹配 - 普通订阅路由 (/:uid 格式)
		const token = url.searchParams.get('token');
		if (pathname !== '/' && token !== null) {
			// 验证token
			const uid = pathname.slice(1);
			const authConfig = AuthUtils.validateToken(uid, token, env);
			if (authConfig instanceof Response) return authConfig;

			console.log('📡 匹配普通订阅路由');
			console.log(`👤 提取用户ID: ${uid} ${authConfig.mode}`);

			if (authConfig.mode === 0) {
				const subscriptionHandler = this.handlers.get(RoutesPath.subscription);
				if (subscriptionHandler) {
					const response = await (subscriptionHandler as any).handle(request, env, { uid });
					if (response) return response;
				}
			} else if (authConfig.mode === 1) {
				const subscriptionHandler = new SubRudeHandler();
				if (subscriptionHandler) {
					const response = await (subscriptionHandler as any).handle(request, env, { uid });
					if (response) return response;
				}
			}
		}

		console.log('❌ 没有匹配的路由');
		return new Response('Not Found', { status: 404 });
	}
}
