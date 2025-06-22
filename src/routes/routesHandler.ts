import { RoutesPathConfig } from '@/config/routes.config';
import { KvHandler } from '@/module/kv/kvHandler';
import { InnerUser } from '@/module/userManager/innerUserConfig';
import { UserManager } from '@/module/userManager/userManager';
import { ClashHandler } from '@/routes/handler/clashHandler';
import { IgnoreHandler } from '@/routes/handler/ignoreHandler';
import { ConfigPageHandler } from '@/routes/handler/pages/configPageHandler';
import { AdminPageHandler } from '@/routes/handler/pages/adminPageHandler';
import { StorageHandler } from '@/routes/handler/storageHandler';
import { UserConfigHandler } from '@/routes/handler/userConfigHandler';
import { SuperAdminHandler } from '@/routes/handler/superAdminHandler';
import { SubscribeParamsValidator } from '@/types/url-params.types';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

export class Router {
	private app: Hono<{ Bindings: Env }>;

	constructor() {
		this.app = new Hono<{ Bindings: Env }>();
		this.setupMiddleware();
		this.setupRoutes();
	}

	private setupMiddleware() {
		// 请求日志中间件
		this.app.use(
			'*',
			logger((message) => {
				console.log(`🌐 ${message}`);
			})
		);

		// CORS 中间件
		this.app.use(
			'*',
			cors({
				origin: '*',
				allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
				allowHeaders: ['Content-Type', 'Authorization'],
			})
		);

		// 静态资源忽略中间件
		this.app.use('*', async (c, next) => {
			const ignoreHandler = new IgnoreHandler();
			const ignoreResponse = await ignoreHandler.handle(c.req.raw, c.env);
			if (ignoreResponse) {
				return ignoreResponse;
			}
			await next();
		});
	}

	private setupRoutes() {
		// 健康检查路由
		this.app.get('/health', (c) => {
			return c.json({ status: 'ok', timestamp: new Date().toISOString() });
		});

		// 精确匹配的静态路由
		// 存储处理器
		this.app.all(RoutesPathConfig.storage, async (c) => {
			console.log(`✅ 静态路由匹配: ${RoutesPathConfig.storage}`);
			try {
				const handler = new StorageHandler();
				const response = await handler.handle(c.req.raw, c.env);
				return response || c.text('Handler returned null', 500);
			} catch (error) {
				console.error(`❌ 处理器错误 ${RoutesPathConfig.storage}:`, error);
				return c.text('Internal Server Error', 500);
			}
		});

		// KV处理器
		this.app.all(RoutesPathConfig.kv, async (c) => {
			console.log(`✅ 静态路由匹配: ${RoutesPathConfig.kv}`);
			try {
				const handler = new KvHandler();
				const response = await handler.handle(c.req.raw, c.env);
				return response || c.text('Handler returned null', 500);
			} catch (error) {
				console.error(`❌ 处理器错误 ${RoutesPathConfig.kv}:`, error);
				return c.text('Internal Server Error', 500);
			}
		});

		// 用户配置处理器
		this.app.all(RoutesPathConfig.userConfig, async (c) => {
			console.log(`✅ 静态路由匹配: ${RoutesPathConfig.userConfig}`);
			try {
				const handler = new UserConfigHandler();
				const response = await handler.handle(c.req.raw, c.env);
				return response || c.text('Handler returned null', 500);
			} catch (error) {
				console.error(`❌ 处理器错误 ${RoutesPathConfig.userConfig}:`, error);
				return c.text('Internal Server Error', 500);
			}
		});

		// 配置页面处理器
		this.app.all(RoutesPathConfig.configPage, async (c) => {
			console.log(`✅ 静态路由匹配: ${RoutesPathConfig.configPage}`);
			try {
				const handler = new ConfigPageHandler();
				const response = await handler.handle(c.req.raw, c.env);
				return response || c.text('Handler returned null', 500);
			} catch (error) {
				console.error(`❌ 处理器错误 ${RoutesPathConfig.configPage}:`, error);
				return c.text('Internal Server Error', 500);
			}
		});

		// 超级管理员页面处理器
		this.app.all('/admin/*', async (c) => {
			console.log(`✅ 超级管理员页面路由匹配: ${c.req.path}`);
			try {
				const handler = new AdminPageHandler();
				const response = await handler.handle(c.req.raw, c.env);
				return response || c.text('Handler returned null', 500);
			} catch (error) {
				console.error(`❌ 超级管理员页面处理器错误:`, error);
				return c.text('Internal Server Error', 500);
			}
		});

		// 超级管理员API处理器
		this.app.all('/api/admin/*', async (c) => {
			console.log(`✅ 超级管理员API路由匹配: ${c.req.path}`);
			try {
				const handler = new SuperAdminHandler();
				const response = await handler.handle(c.req.raw, c.env);
				return response || c.text('Handler returned null', 500);
			} catch (error) {
				console.error(`❌ 超级管理员API处理器错误:`, error);
				return c.text('Internal Server Error', 500);
			}
		});

		// 配置页面路由组
		const configRoute = this.app.basePath('/config');

		// 兼容方式: /config/:userId
		configRoute.get('/:userId', async (c) => {
			const userId = c.req.param('userId');
			console.log(`📄 配置页面 (路径参数): ${userId}`);
			return this.handleConfigPage(c);
		});

		// API 路由组
		const apiRoute = this.app.basePath('/api');

		// 用户配置API: /api/config/users/:userId
		apiRoute.all('/config/users/:userId', async (c) => {
			const userId = c.req.param('userId');
			console.log(`🔧 用户配置API: ${c.req.method} ${userId}`);
			try {
				const userConfigHandler = new UserConfigHandler();
				const response = await userConfigHandler.handle(c.req.raw, c.env);
				return response || c.text('User config handler failed', 500);
			} catch (error) {
				console.error('❌ 用户配置API错误:', error);
				return c.json({ error: 'Internal Server Error' }, 500);
			}
		});

		// 订阅路由 (需要在最后定义，避免冲突)
		this.app.get('/:uid', async (c) => {
			const uid = c.req.param('uid');

			// 跳过一些特殊路径
			if (['favicon.ico', 'robots.txt', 'health'].includes(uid)) {
				return c.notFound();
			}

			try {
				const url = new URL(c.req.url);
				const queryParams = SubscribeParamsValidator.parseParams(url);
				console.log(`📡 订阅路由: ${uid}`, queryParams);

				if (queryParams.token !== null) {
					const userManager = new UserManager(c.env);
					const authConfig = await userManager.validateAndGetUser(uid, queryParams.token);
					if (!authConfig) {
						return c.json({ error: 'Unauthorized' }, 401);
					}
					const innerUser = new InnerUser(authConfig.config);

					console.log(`👤 用户认证成功: ${uid}`);
					const clashHandler = new ClashHandler();
					const response = await clashHandler.handle(c.req.raw, c.env, { innerUser: innerUser });
					return response || c.text('Clash handler failed', 500);
				} else {
					return c.json(
						{
							error: '需要token参数',
							usage: `/${uid}?token=<your_token>`,
						},
						400
					);
				}
			} catch (error) {
				console.error('❌ 订阅路由错误:', error);
				return c.json(
					{
						error: 'Bad Request',
						message: error instanceof Error ? error.message : 'Unknown error',
					},
					400
				);
			}
		});

		// 404 处理
		this.app.notFound((c) => {
			console.log(`❌ 路由未找到: ${c.req.method} ${c.req.path}`);
			return c.json(
				{
					error: 'Not Found',
					path: c.req.path,
					method: c.req.method,
					availableRoutes: ['/health', '/config?user=<userId>', '/config/:userId', '/api/config/users/:userId', '/:uid?token=<token>'],
				},
				404
			);
		});

		// 错误处理
		this.app.onError((err, c) => {
			console.error('❌ 全局错误:', err);
			return c.json(
				{
					error: 'Internal Server Error',
					message: err.message,
				},
				500
			);
		});
	}

	private async handleConfigPage(c: any) {
		try {
			const configPageHandler = new ConfigPageHandler();
			const response = await configPageHandler.handle(c.req.raw, c.env);
			return response || c.text('Config page handler failed', 500);
		} catch (error) {
			console.error('❌ 配置页面错误:', error);
			return c.json({ error: 'Internal Server Error' }, 500);
		}
	}

	async route(request: Request, env: Env): Promise<Response> {
		return this.app.fetch(request, env);
	}
}
