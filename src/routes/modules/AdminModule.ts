import { SuperAdminHandler } from '@/routes/handler/superAdminHandler';
import { BaseRouteModule } from '@/routes/modules/base/RouteModule';
import { ROUTE_PATHS, adminDeleteUserRoute, adminGetUsersRoute, adminUserCreateRoute } from '@/routes/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 管理员功能路由模块
 */
export class AdminModule extends BaseRouteModule {
	readonly moduleName = 'Admin';

	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		// 删除用户配置路由
		app.openapi(adminDeleteUserRoute, async (c) => {
			const uid = c.req.param('uid');
			console.log(`🔧 ${this.moduleName}: DELETE ${uid}`);

			try {
				const superAdminHandler = new SuperAdminHandler();
				const response = await superAdminHandler.handle(c.req.raw, c.env);
				return (response || c.json({ error: 'Handler returned null' }, 500)) as any;
			} catch (error) {
				const errorResponse = this.handleError(error, '删除用户配置');
				return c.json(errorResponse, 500) as any;
			}
		});

		// 创建用户路由
		app.openapi(adminUserCreateRoute, async (c) => {
			const body = c.req.valid('json');
			console.log(`🆕 ${this.moduleName}: PUT ${ROUTE_PATHS.adminUserCreate}`);

			try {
				const superAdminHandler = new SuperAdminHandler();
				const response = await superAdminHandler.handle(c.req.raw, c.env);
				return (response || c.json({ error: 'Handler returned null' }, 500)) as any;
			} catch (error) {
				const errorResponse = this.handleError(error, '创建用户');
				return c.json(errorResponse, 400) as any;
			}
		});

		// 获取所有用户路由
		app.openapi(adminGetUsersRoute, async (c) => {
			console.log(`✅ ${this.moduleName}: 获取所有用户`);

			try {
				const handler = new SuperAdminHandler();
				const response = await handler.handle(c.req.raw, c.env);
				return (response || c.text('Handler returned null', 500)) as any;
			} catch (error) {
				const errorResponse = this.handleError(error, '获取所有用户');
				return c.json(errorResponse, 500) as any;
			}
		});
	}
}
