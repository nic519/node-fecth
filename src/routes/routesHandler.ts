import { GlobalConfig } from '@/config/global-config';
import { RoutesPathConfig } from '@/config/routes.config';
import { KvHandler } from '@/module/kv/kvHandler';
import { InnerUser } from '@/module/userManager/innerUserConfig';
import { UserManager } from '@/module/userManager/userManager';
import { ClashHandler } from '@/routes/handler/clashHandler';
import { IgnoreHandler } from '@/routes/handler/ignoreHandler';
import { StorageHandler } from '@/routes/handler/storageHandler';
import { SuperAdminHandler } from '@/routes/handler/superAdminHandler';
import { UserConfigHandler } from '@/routes/handler/userConfigHandler';
import { healthRoute } from '@/routes/openapi-routes';
import { SubscribeParamsValidator } from '@/types/request/url-params.types';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

export class Router {
	private app: OpenAPIHono<{ Bindings: Env }>;

	constructor() {
		this.app = new OpenAPIHono<{ Bindings: Env }>();
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
		// 全局调试中间件
		this.app.use('*', (c, next) => {
			console.log(`🌍 全局请求: ${c.req.method} ${c.req.path} (完整URL: ${c.req.url})`);
			return next();
		});

		// OpenAPI 文档路由
		this.app.doc('/openapi.json', {
			openapi: '3.0.0',
			info: {
				title: 'Node-Fetch API',
				version: '1.0.0',
				description: `订阅管理和用户配置 API

## 功能特性
- 🔐 用户配置管理
- 📊 流量统计
- 🔄 订阅转换
- 👥 用户管理（管理员功能）
- 🗄️ KV 存储服务

## 认证说明
大部分 API 需要通过 \`token\` 查询参数进行认证。管理员接口需要 \`superToken\` 参数。`,
			},
			servers: [
				{ url: '/api', description: 'API 服务器' },
				{ url: 'http://localhost:8787/api', description: '开发服务器' },
			],
		});

		// Swagger UI 文档路由（在开发环境才能访问）
		if (GlobalConfig.isDev) {
			this.app.get('/docs', swaggerUI({ url: '/openapi.json' }));
		}

		// 健康检查路由（使用 OpenAPI 定义）
		this.app.openapi(healthRoute, (c) => {
			return c.json({ status: 'ok', timestamp: new Date().toISOString() });
		});

		// 用户配置相关路由（兼容现有处理器）
		this.app.get('/api/config/users/:userId', async (c) => {
			const userId = c.req.param('userId');
			console.log(`🔧 用户配置API: ${c.req.method} ${userId}`);
			try {
				const userConfigHandler = new UserConfigHandler();
				const response = await userConfigHandler.handle(c.req.raw, c.env);
				return response || c.json({ error: 'Handler returned null' }, 500);
			} catch (error) {
				console.error('❌ 获取用户配置错误:', error);
				return c.json({ error: 'Internal Server Error' }, 500);
			}
		});

		this.app.put('/api/config/users/:userId', async (c) => {
			const userId = c.req.param('userId');
			console.log(`🔧 用户配置API: ${c.req.method} ${userId}`);
			try {
				const userConfigHandler = new UserConfigHandler();
				const response = await userConfigHandler.handle(c.req.raw, c.env);
				return response || c.json({ error: 'Handler returned null' }, 500);
			} catch (error) {
				console.error('❌ 更新用户配置错误:', error);
				return c.json({ error: 'Internal Server Error' }, 500);
			}
		});

		this.app.delete('/api/config/users/:userId', async (c) => {
			const userId = c.req.param('userId');
			console.log(`🔧 用户配置API: ${c.req.method} ${userId}`);
			try {
				const userConfigHandler = new UserConfigHandler();
				const response = await userConfigHandler.handle(c.req.raw, c.env);
				return response || c.json({ error: 'Handler returned null' }, 500);
			} catch (error) {
				console.error('❌ 删除用户配置错误:', error);
				return c.json({ error: 'Internal Server Error' }, 500);
			}
		});

		this.app.put('/create/user', async (c) => {
			console.log(`🆕 创建用户API: PUT /create/user`);

			try {
				const body = await c.req.json();
				const { userId, ...requestData } = body;

				if (!userId) {
					return c.json({ error: 'Missing userId in request body' }, 400);
				}

				// 构造一个符合UserConfigHandler预期的请求
				const originalUrl = new URL(c.req.url);
				const newUrl = `${originalUrl.protocol}//${originalUrl.host}/api/config/users/${userId}`;

				const modifiedRequest = new Request(newUrl, {
					method: 'PUT',
					headers: c.req.raw.headers,
					body: JSON.stringify(requestData),
				});

				const userConfigHandler = new UserConfigHandler();
				const response = await userConfigHandler.handle(modifiedRequest, c.env);
				return response || c.json({ error: 'User creation failed' }, 500);
			} catch (error) {
				console.error('❌ 创建用户API错误:', error);
				return c.json(
					{
						error: 'Internal Server Error',
						message: error instanceof Error ? error.message : 'Unknown error',
					},
					500
				);
			}
		});

		// API接口路由
		// 存储API处理器
		this.app.all(RoutesPathConfig.storage, async (c) => {
			console.log(`✅ 存储API路由匹配: ${RoutesPathConfig.storage}`);
			try {
				const handler = new StorageHandler();
				const response = await handler.handle(c.req.raw, c.env);
				return response || c.text('Handler returned null', 500);
			} catch (error) {
				console.error(`❌ 存储API处理器错误 ${RoutesPathConfig.storage}:`, error);
				return c.text('Internal Server Error', 500);
			}
		});

		// KV存储API处理器
		this.app.all(RoutesPathConfig.kv, async (c) => {
			console.log(`✅ KV存储API路由匹配: ${RoutesPathConfig.kv}`);
			try {
				const handler = new KvHandler();
				const response = await handler.handle(c.req.raw, c.env);
				return response || c.text('Handler returned null', 500);
			} catch (error) {
				console.error(`❌ KV存储API处理器错误 ${RoutesPathConfig.kv}:`, error);
				return c.text('Internal Server Error', 500);
			}
		});

		// 直接在主应用上定义API路由 (避免basePath问题)

		// 创建用户API: /create/user (Worker部署无需/api前缀)
		this.app.put('/create/user', async (c) => {
			console.log(`🆕 创建用户API: PUT /create/user`);

			try {
				const body = await c.req.json();
				const { userId, ...requestData } = body;

				if (!userId) {
					return c.json({ error: 'Missing userId in request body' }, 400);
				}

				// 构造一个符合UserConfigHandler预期的请求
				const originalUrl = new URL(c.req.url);
				const newUrl = `${originalUrl.protocol}//${originalUrl.host}/api/config/users/${userId}`;

				const modifiedRequest = new Request(newUrl, {
					method: 'PUT',
					headers: c.req.raw.headers,
					body: JSON.stringify(requestData),
				});

				const userConfigHandler = new UserConfigHandler();
				const response = await userConfigHandler.handle(modifiedRequest, c.env);
				return response || c.text('User creation failed', 500);
			} catch (error) {
				console.error('❌ 创建用户API错误:', error);
				return c.json(
					{
						error: 'Internal Server Error',
						message: error instanceof Error ? error.message : 'Unknown error',
					},
					500
				);
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

		// 获取所有用户列表API: /api/config/allUsers
		this.app.all('/api/config/allUsers', async (c) => {
			console.log(`🔧 获取所有用户API: ${c.req.method} /api/config/allUsers`);
			try {
				const userConfigHandler = new UserConfigHandler();
				const response = await userConfigHandler.handle(c.req.raw, c.env);
				return response || c.text('User config handler failed', 500);
			} catch (error) {
				console.error('❌ 获取所有用户API错误:', error);
				return c.json({ error: 'Internal Server Error' }, 500);
			}
		});

		// 用户配置API: /api/config/users/:userId (带参数的路由)
		this.app.all('/api/config/users/:userId', async (c) => {
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

		// 通用配置API: /api/config/users (最通用的路由，放在最后)
		this.app.all('/api/config/users', async (c) => {
			console.log(`🔧 通用配置API: ${c.req.method} /api/config/users`);
			try {
				const userConfigHandler = new UserConfigHandler();
				const response = await userConfigHandler.handle(c.req.raw, c.env);
				return response || c.text('User config handler failed', 500);
			} catch (error) {
				console.error('❌ 通用配置API错误:', error);
				return c.json({ error: 'Internal Server Error' }, 500);
			}
		});

		// 订阅路由 (需要在最后定义，避免冲突)
		this.app.get('/:uid', async (c) => {
			const uid = c.req.param('uid');

			// 跳过一些特殊路径、静态文件和API路径
			if (['favicon.ico', 'robots.txt', 'health', 'openapi.json', 'api', 'create'].includes(uid)) {
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
					availableRoutes: [
						'/health',
						'/config?user=<userId>',
						'/config/:userId',
						'/api/config/users/:userId',
						'PUT /create/user',
						'/:uid?token=<token>',
					],
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

	async route(request: Request, env: Env): Promise<Response> {
		return this.app.fetch(request, env);
	}
}
