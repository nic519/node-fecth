import { GlobalConfig } from '@/config/global-config';
import { MiddlewareManager } from '@/routes/middleware';
import { RouteRegistry } from '@/routes/modules';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';

export class Router {
	private app: OpenAPIHono<{ Bindings: Env }>;
	private routeRegistry: RouteRegistry;

	constructor() {
		this.app = new OpenAPIHono<{ Bindings: Env }>();
		this.routeRegistry = new RouteRegistry();
		this.initialize();
	}

	/**
	 * 初始化路由器
	 */
	private initialize(): void {
		this.setupMiddleware();
		this.setupDocumentation();
		this.setupRoutes();
		this.setupErrorHandling();
	}

	/**
	 * 设置中间件
	 */
	private setupMiddleware(): void {
		MiddlewareManager.setupMiddleware(this.app);
	}

	/**
	 * 设置 API 文档
	 */
	private setupDocumentation(): void {
		// 手动添加 OpenAPI 文档路由（确保可用）
		this.app.get('/openapi.json', (c) => {
			const openApiDoc = this.getOpenAPIDocument();
			return c.json(openApiDoc);
		});

		// Swagger UI 文档路由（在开发环境才能访问）
		if (GlobalConfig.isDev) {
			this.app.get('/docs', swaggerUI({ url: '/openapi.json' }));
		}
	}

	/**
	 * 设置所有路由
	 */
	private setupRoutes(): void {
		// 注册所有模块化路由
		this.routeRegistry.registerAllModules(this.app);

		console.log('📋 已注册的路由模块:', this.routeRegistry.getRegisteredModules().join(', '));
	}

	/**
	 * 设置错误处理
	 */
	private setupErrorHandling(): void {
		// 404 处理
		this.app.notFound((c) => {
			console.log(`❌ 路由未找到: ${c.req.method} ${c.req.path}`);
			return c.json(
				{
					error: 'Not Found',
					path: c.req.path,
					method: c.req.method,
					availableRoutes: ['/health', '/api/config/users/:uid', '/create/user', '/:uid?token=<token>'],
					registeredModules: this.routeRegistry.getRegisteredModules(),
				},
				404
			);
		});

		// 全局错误处理
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

	/**
	 * 处理请求
	 * @param request 请求对象
	 * @param env 环境变量
	 */
	async route(request: Request, env: Env): Promise<Response> {
		return this.app.fetch(request, env);
	}

	/**
	 * 获取 OpenAPI 文档（用于生成静态文件）
	 */
	getOpenAPIDocument() {
		return this.app.getOpenAPI31Document({
			openapi: '3.1.0',
			info: {
				title: 'Node-Fetch API',
				version: '1.0.0',
				description: `订阅管理和用户配置 API - 自动生成文档

## 功能特性
- �� 用户配置管理
- 📊 流量统计
- 🔄 订阅转换
- 👥 用户管理（管理员功能）
- 🗄️ KV 存储服务

## 认证说明
大部分 API 需要通过 \`token\` 查询参数进行认证。管理员接口需要 \`superToken\` 参数。

## 已注册模块
${this.routeRegistry
	.getRegisteredModules()
	.map((name) => `- ${name}`)
	.join('\n')}`,
			},
			servers: [{ url: 'http://localhost:8787', description: '开发服务器' }],
		});
	}

	/**
	 * 获取路由注册器实例（用于扩展）
	 */
	getRouteRegistry(): RouteRegistry {
		return this.routeRegistry;
	}
}
