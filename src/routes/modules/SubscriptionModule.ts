import { InnerUser } from '@/module/userManager/innerUserConfig';
import { UserManager } from '@/module/userManager/userManager';
import { ClashHandler } from '@/routes/handler/clashHandler';
import { BaseRouteModule } from '@/routes/modules/base/RouteModule';
import { getSubscriptionRoute } from '@/routes/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 订阅功能路由模块
 */
export class SubscriptionModule extends BaseRouteModule {
	readonly moduleName = 'Subscription';

	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		// 订阅路由
		app.openapi(getSubscriptionRoute, async (c) => {
			const uid = c.req.param('uid');
			const query = c.req.valid('query');

			console.log(`📡 ${this.moduleName}: ${uid}`, query);

			try {
				const userManager = new UserManager(c.env);
				const authConfig = await userManager.validateAndGetUser(uid, query.token);

				if (!authConfig) {
					return c.json({ error: 'Unauthorized' }, 401);
				}

				const innerUser = new InnerUser(authConfig.config);
				console.log(`👤 ${this.moduleName}: 用户认证成功 ${uid}`);

				const clashHandler = new ClashHandler();
				const response = await clashHandler.handle(c.req.raw, c.env, { innerUser: innerUser });
				return (response || c.text('Clash handler failed', 500)) as any;
			} catch (error) {
				const errorResponse = this.handleError(error, '订阅路由处理');
				return c.json(
					{
						...errorResponse,
						error: 'Bad Request',
					},
					400
				) as any;
			}
		});
	}
}
