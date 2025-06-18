import { RouteHandler } from '@/types/routes.types';
import { RoutesPathConfig } from '@/config/routes.config';
import { StorageHandler } from '@/routes/handler/storageHandler';
import { KvHandler } from '@/module/kv/kvHandler';
import { SubRudeHandler } from '@/routes/handler/subRudeHandler';
import { IgnoreHandler } from '@/routes/handler/ignoreHandler';
import { AuthUtils } from '@/utils/authUtils';
import { SubscribeParamsValidator } from '@/types/url-params.types';
import { DBUser } from '@/types/user.types';

export class Router {
	private handlers: Map<string, RouteHandler> = new Map();

	constructor() {
		this.registerHandlers();
	}

	private registerHandlers() {
		this.handlers.set(RoutesPathConfig.storage, new StorageHandler());
		this.handlers.set(RoutesPathConfig.kv, new KvHandler());
	}

	async route(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;

		// 1. 忽略静态资源
		const ignoreHandler = new IgnoreHandler();
		const ignoreResponse = await ignoreHandler.handle(request, env);
		if (ignoreResponse) return ignoreResponse;

		console.log(`🔍 路由匹配: ${pathname}`);

		// 2.处理精确匹配路由
		for (const [route, handler] of this.handlers) {
			if (route === pathname) {
				console.log(`✅ 精确匹配路由: ${route}`);
				const response = await handler.handle(request, env);
				if (response) return response;
			}
		}

		// 3. 动态路由匹配 - 普通订阅路由 (/:uid 格式)
		const queryParams = SubscribeParamsValidator.parseParams(url);
		console.log('📡 匹配普通订阅路由', queryParams);

		if (pathname !== '/' && queryParams.token !== null) {
			// 验证token
			const uid = pathname.slice(1);
			const authConfig = AuthUtils.validateToken(uid, queryParams.token, env);
			if (authConfig instanceof Response) return authConfig;

			console.log(`👤 提取用户ID: ${uid}`);
			const subscriptionHandler = new SubRudeHandler();
			const response = await subscriptionHandler.handle(request, env, { authConfig });
			if (response) return response;
		}

		console.log('❌ 没有匹配的路由');
		return new Response('Not Found', { status: 404 });
	}
}
