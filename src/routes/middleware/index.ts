import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { GlobalConfig } from '../../config/global-config';
import { responseValidatorMiddleware } from './responseValidator';

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

		// 响应格式验证中间件（仅开发环境）
		if (GlobalConfig.isDev) {
			app.use('*', responseValidatorMiddleware());
			console.log('🔍 已启用响应格式验证中间件（开发环境）');
		}

		// 全局调试中间件
		app.use('*', (c, next) => {
			console.log(`🌍 全局请求: ${c.req.method} ${c.req.path} (完整URL: ${c.req.url})`);
			return next();
		});
	}
}
