import { KvHandler } from '@/module/kv/kvHandler';
import { StorageHandler } from '@/routes/handler/storageHandler';
import { BaseRouteModule } from '@/routes/modules/base/RouteModule';
import { kvRoute, ROUTE_PATHS, storageRoute } from '@/routes/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 存储功能路由模块
 */
export class StorageModule extends BaseRouteModule {
	readonly moduleName = 'Storage';

	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		// 存储相关路由
		app.openapi(storageRoute, async (c) => {
			console.log(`✅ ${this.moduleName}: 存储API路由匹配 GET ${ROUTE_PATHS.storage}`);

			try {
				const handler = new StorageHandler();
				const response = await handler.handle(c.req.raw, c.env);
				return (response || c.text('Handler returned null', 500)) as any;
			} catch (error) {
				const errorResponse = this.handleError(error, '存储API处理');
				return c.json(errorResponse, 500) as any;
			}
		});

		// KV存储相关路由
		app.openapi(kvRoute, async (c) => {
			console.log(`✅ ${this.moduleName}: KV存储API路由匹配 GET ${ROUTE_PATHS.kv}`);

			try {
				const handler = new KvHandler();
				const response = await handler.handle(c.req.raw, c.env);
				return (response || c.text('Handler returned null', 500)) as any;
			} catch (error) {
				const errorResponse = this.handleError(error, 'KV存储API处理');
				return c.json(errorResponse, 500) as any;
			}
		});
	}
}
