import { UserConfigHandler } from '@/routes/handler/userConfigHandler';
import { BaseRouteModule } from '@/routes/modules/base/RouteModule';
import { ROUTE_PATHS, getUserDetailRoute, userUpdateRoute } from '@/routes/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 用户管理路由模块
 */
export class UserModule extends BaseRouteModule {
	readonly moduleName = 'User';

	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		console.log(`🔧 ${this.moduleName}: 开始注册路由...`);
		
		// 简单的测试路由（不使用 OpenAPI 验证）
		// app.post('/config/user/update/:uid', async (c) => {
		// 	console.log(`🚀 简单测试路由被调用: ${c.req.param('uid')}`);
		// 	console.log(`🚀 请求方法: ${c.req.method}`);
		// 	console.log(`🚀 请求路径: ${c.req.path}`);
		// 	console.log(`🚀 请求URL: ${c.req.url}`);
			
		// 	return c.json({ 
		// 		message: '测试路由工作正常',
		// 		uid: c.req.param('uid'),
		// 		method: c.req.method,
		// 		path: c.req.path 
		// 	});
		// });
		
		// 更新用户配置路由
		console.log(`🔧 ${this.moduleName}: 注册 userUpdateRoute:`, {
			method: userUpdateRoute.method,
			path: userUpdateRoute.path
		});
		app.openapi(userUpdateRoute, async (c) => {
			const uid = c.req.param('uid');
			console.log(`🔧 ${this.moduleName}: ${c.req.method} ${uid}`);
			console.log(`🔗 请求URL: ${c.req.url}`);
			console.log(`🔗 原始请求URL: ${c.req.raw.url}`);

			try {
				const userConfigHandler = new UserConfigHandler();
				console.log(`📞 调用 UserConfigHandler.canHandle...`);
				const canHandle = userConfigHandler.canHandle(c.req.raw);
				console.log(`📞 UserConfigHandler.canHandle 结果: ${canHandle}`);
				
				if (!canHandle) {
					console.log(`❌ UserConfigHandler 拒绝处理此请求`);
					return c.json({ error: 'Handler cannot handle this request' }, 400);
				}
				
				console.log(`📞 调用 UserConfigHandler.handle...`);
				const response = await userConfigHandler.handle(c.req.raw, c.env);
				console.log(`📞 UserConfigHandler.handle 返回结果:`, response?.status);
				return (response || c.json({ error: 'Handler returned null' }, 500)) as any;
			} catch (error) {
				console.error(`❌ UserModule 错误:`, error);
				const errorResponse = this.handleError(error, '更新用户配置');
				return c.json(errorResponse, 500) as any;
			}
		});

		// 用户详情路由
		app.openapi(getUserDetailRoute, async (c) => {
			const uid = c.req.param('uid');
			console.log(`🔧 ${this.moduleName}: ${c.req.method} ${ROUTE_PATHS.userDetail} - ${uid}`);

			try {
				const userConfigHandler = new UserConfigHandler();
				const response = await userConfigHandler.handle(c.req.raw, c.env);
				return (response || c.text('User config handler failed', 500)) as any;
			} catch (error) {
				const errorResponse = this.handleError(error, '获取用户详情');
				return c.json(errorResponse, 500) as any;
			}
		});
	}
}
