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
		// 更新用户配置路由
		app.openapi(userUpdateRoute, async (c) => {
			const uid = c.req.param('uid');
			console.log(`🔧 ${this.moduleName}: PUT ${uid}`);

			try {
				const userConfigHandler = new UserConfigHandler();
				const response = await userConfigHandler.handle(c.req.raw, c.env);
				return (response || c.json({ error: 'Handler returned null' }, 500)) as any;
			} catch (error) {
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
				const response = await userConfigHandler.getUserConfig(c.req.raw, c.env, uid);
				return (response || c.text('User config handler failed', 500)) as any;
			} catch (error) {
				const errorResponse = this.handleError(error, '获取用户详情');
				return c.json(errorResponse, 500) as any;
			}
		});
	}
}
