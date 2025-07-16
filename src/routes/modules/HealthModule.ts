import { BaseRouteModule } from '@/routes/modules/base/RouteModule';
import { healthRoute } from '@/routes/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 健康检查路由模块
 */
export class HealthModule extends BaseRouteModule {
	readonly moduleName = 'Health';

	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		// 健康检查路由
		app.openapi(healthRoute, (c) => {
			console.log(`✅ ${this.moduleName}: 健康检查请求`);
			return c.json({
				status: 'ok',
				timestamp: new Date().toISOString(),
				module: this.moduleName,
			});
		});
	}
}
