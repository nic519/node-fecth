import { BaseRouteModule } from '@/routes/modules/base/RouteModule';
import { healthRoute } from '@/routes/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { ResponseCodes } from '@/types/openapi-schemas';

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
				code: ResponseCodes.SUCCESS,
				msg: '服务正常',
				data: {
					status: 'ok',
					timestamp: new Date().toISOString(),
				},
			});
		});
	}
}
