import { UserManager } from '@/module/userManager/userManager';
import { UserConfigHandler } from '@/routes/handler/userConfigHandler';
import { BaseRouteModule } from '@/routes/modules/base/RouteModule';
import { ROUTE_PATHS, getUserDetailRoute, userUpdateRoute } from '@/routes/openapi';
import { ResponseCodes } from '@/types/openapi-schemas';
import { AuthUtils } from '@/utils/authUtils';
import { ResponseUtils } from '@/utils/responseUtils';
import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 用户管理路由模块
 */
export class UserModule extends BaseRouteModule {
	readonly moduleName = 'User';

	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		console.log(`🔧 ${this.moduleName}: 开始注册路由...`);

		// 更新用户配置路由
		console.log(`🔧 ${this.moduleName}: 注册 userUpdateRoute:`, {
			method: userUpdateRoute.method,
			path: userUpdateRoute.path,
		});
		app.openapi(userUpdateRoute, async (c) => {
			const uid = c.req.param('uid');
			console.log(`🔧 ${this.moduleName}: ${c.req.method} ${uid}`);
			console.log(`🔗 请求URL: ${c.req.url}`);
			console.log(`🔗 原始请求URL: ${c.req.raw.url}`);

			try {
				// 身份验证
				console.log(`🔐 开始身份验证: ${uid}`);
				const authResult = await AuthUtils.authenticate(c.req.raw, c.env, uid);
				console.log(`✅ 用户验证成功: ${uid} (来源: ${authResult.meta.source})`);

				// 从已验证的请求体中获取配置数据
				const requestBody = c.req.valid('json'); // OpenAPI 已验证的数据
				const userConfig = requestBody.config;

				// 保存用户配置
				const userManager = new UserManager(c.env);
				const success = await userManager.saveUserConfig(uid, userConfig);
				if (!success) {
					return ResponseUtils.jsonError(c, ResponseCodes.INTERNAL_ERROR, '保存用户配置失败');
				}

				return ResponseUtils.success(
					{
						uid,
						timestamp: new Date().toISOString(),
						message: '用户配置保存成功',
					},
					'用户配置保存成功'
				);
			} catch (error) {
				console.error(`❌ UserModule 错误:`, error);
				console.error(`❌ 错误堆栈:`, error instanceof Error ? error.stack : error);

				// 根据错误类型返回不同的响应
				if (error instanceof Error && error.message.includes('Authentication failed')) {
					return ResponseUtils.jsonError(c, ResponseCodes.UNAUTHORIZED, error.message);
				}

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
