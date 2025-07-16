import { IgnoreHandler } from '@/routes/handler/ignoreHandler';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

export class MiddlewareManager {
	/**
	 * 设置所有中间件
	 * @param app OpenAPIHono 应用实例
	 */
	static setupMiddleware(app: OpenAPIHono<{ Bindings: Env }>) {
		// 请求日志中间件
		app.use(
			'*',
			logger((message) => {
				console.log(`🌐 ${message}`);
			})
		);

		// CORS 中间件
		app.use(
			'*',
			cors({
				origin: '*',
				allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
				allowHeaders: ['Content-Type', 'Authorization'],
			})
		);

		// 静态资源忽略中间件
		app.use('*', async (c, next) => {
			const ignoreHandler = new IgnoreHandler();
			const ignoreResponse = await ignoreHandler.handle(c.req.raw, c.env);
			if (ignoreResponse) {
				return ignoreResponse;
			}
			await next();
		});

		// 全局调试中间件
		app.use('*', (c, next) => {
			console.log(`🌍 全局请求: ${c.req.method} ${c.req.path} (完整URL: ${c.req.url})`);
			return next();
		});
	}
}
