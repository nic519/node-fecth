import { RouteHandler } from '@/types/routes.types';
import { RoutesPathConfig } from '@/config/routes.config';
import { StorageHandler } from '@/routes/handler/storageHandler';
import { KvHandler } from '@/module/kv/kvHandler';
import { ClashHandler } from '@/routes/handler/clashHandler';
import { IgnoreHandler } from '@/routes/handler/ignoreHandler';
import { UserConfigHandler } from '@/routes/handler/userConfigHandler';
import { ConfigPageHandler } from '@/routes/handler/configPageHandler';
import { UserManager } from '@/module/userManager/userManager';
import { SubscribeParamsValidator } from '@/types/url-params.types';
import { AuthUtils } from '@/utils/authUtils';

export class Router {
	private handlers: Map<string, RouteHandler> = new Map();

	constructor() {
		this.registerHandlers();
	}

	private registerHandlers() {
		this.handlers.set(RoutesPathConfig.storage, new StorageHandler());
		this.handlers.set(RoutesPathConfig.kv, new KvHandler());
		this.handlers.set(RoutesPathConfig.userConfig, new UserConfigHandler());
		this.handlers.set(RoutesPathConfig.configPage, new ConfigPageHandler());
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

		// 3. 动态路由匹配 - 配置页面路由 (/config/:userId)
		const configPageMatch = pathname.match(/^\/config\/(.+)$/);
		if (configPageMatch) {
			const userId = configPageMatch[1];
			console.log(`📄 匹配配置页面路由: ${userId}`);
			const configPageHandler = new ConfigPageHandler();
			const response = await configPageHandler.handle(request, env);
			if (response) return response;
		}

		// 4. 动态路由匹配 - 用户配置API路由 (/api/config/users/:userId)
		const userConfigApiMatch = pathname.match(/^\/api\/config\/users\/(.+)$/);
		if (userConfigApiMatch) {
			const userId = userConfigApiMatch[1];
			console.log(`🔧 匹配用户配置API路由: ${userId}`);
			const userConfigHandler = new UserConfigHandler();
			const response = await userConfigHandler.handle(request, env);
			if (response) return response;
		}

		// 5. 动态路由匹配 - 普通订阅路由 (/:uid 格式)
		try {
			const queryParams = SubscribeParamsValidator.parseParams(url);
			console.log('📡 匹配普通订阅路由', queryParams);

			if (pathname !== '/' && queryParams.token !== null) {
				// 验证token
				const uid = pathname.slice(1);
				const userManager = new UserManager(env);
				const authConfig = await userManager.validateAndGetUser(uid, queryParams.token);
				if (!authConfig) {
					return AuthUtils.createErrorResponse('Unauthorized', 401);
				}

				console.log(`👤 提取用户ID: ${uid}`);
				const clashHandler = new ClashHandler();
				const response = await clashHandler.handle(request, env, { authConfig });
				if (response) return response;
			}
		} catch (error) {
			console.error('订阅路由验证失败:', error);
			return AuthUtils.createErrorResponse('Bad Request', 400);
		}

		console.log('❌ 没有匹配的路由');
		return new Response('Not Found', { status: 404 });
	}
}
