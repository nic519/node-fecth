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
		this.app.get('/api/openapi.json', (c) => {
			const openApiDoc = this.getOpenAPIDocument();
			return c.json(openApiDoc);
		});

		// Swagger UI 文档路由（在开发环境才能访问）
		if (GlobalConfig.isDev) {
			this.app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }));
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
		// 404 处理 - 支持 SPA 路由
		this.app.notFound(async (c) => {
			const url = new URL(c.req.url);
			const path = url.pathname;

			console.log(`❓ 路由未找到: ${c.req.method} ${path}`);

			// 如果是 API 路径，返回 JSON 错误
			if (path.startsWith('/api/') || path.startsWith('/kv') || path.startsWith('/storage') || path.includes('openapi.json')) {
				return c.json(
					{
						error: 'Not Found',
						path: path,
						method: c.req.method,
						registeredModules: this.routeRegistry.getRegisteredModules(),
					},
					404
				);
			}

			// 对于前端路由，返回 index.html 让 React Router 处理
			try {
				// 尝试从 Workers Static Assets 获取 index.html
				const indexResponse = await c.env.ASSETS.fetch(new Request(new URL('/index.html', c.req.url)));
				if (indexResponse.ok) {
					const indexContent = await indexResponse.text();
					return c.html(indexContent, 200);
				}
			} catch (error) {
				console.warn('⚠️ 无法从 ASSETS 获取 index.html，使用回退方案:', error);
			}

			// 回退方案：返回基本的 HTML 结构
			return c.html(
				`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>节点管理后台</title>
  </head>
  <body>
    <div id="app">
      <div style="padding: 20px; text-align: center;">
        <h1>加载中...</h1>
        <p>如果页面无法正常加载，请检查网络连接。</p>
      </div>
    </div>
    <script>
      // 自动尝试加载最新的构建文件
      fetch('/index.html')
        .then(r => r.text())
        .then(html => document.documentElement.innerHTML = html)
        .catch(e => console.error('Failed to load index.html:', e));
    </script>
  </body>
</html>`,
				200
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
