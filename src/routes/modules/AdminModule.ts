import { SuperAdminManager } from '@/module/userManager/superAdminManager';
import { BaseRouteModule } from '@/routes/modules/base/RouteModule';
import { ROUTE_PATHS, adminDeleteUserRoute, adminGetUsersRoute, adminUserCreateRoute } from '@/routes/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { ResponseCodes, UserConfig } from '@/types/openapi-schemas';

/**
 * 管理员功能路由模块
 */
export class AdminModule extends BaseRouteModule {
	readonly moduleName = 'Admin';

	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		
		// 先校验superToken
		app.use('/api/admin/*', async (c, next) => {
			const superAdminManager = new SuperAdminManager(c.env);
			const authResult = await superAdminManager.validateSuperAdmin(c.req.query('superToken') || '');
			if (!authResult) {
				return c.json({
					code: ResponseCodes.UNAUTHORIZED,
					msg: '超级管理员令牌无效',
				}, 401);
			}
			await next();
		});

		// 删除用户配置路由
		app.openapi(adminDeleteUserRoute, async (c) => {
			const uid = c.req.param('uid');
			console.log(`🔧 ${this.moduleName}: DELETE ${uid}`);

			try {
				const adminId = 'super_admin'; // 简化实现，使用固定ID
				const superAdminManager = new SuperAdminManager(c.env);
				await superAdminManager.deleteUser(uid, adminId);
				
				return c.json({
					code: ResponseCodes.SUCCESS,
					msg: '用户删除成功',
					data: {
						message: '用户删除成功',
						uid: uid,
					},
				});
			} catch (error) {
				const errorResponse = this.handleError(error, '删除用户配置');
				return c.json(errorResponse, 500) as any;
			}
		});

		// 创建用户路由
		app.openapi(adminUserCreateRoute, async (c) => {
			console.log(`🆕 ${this.moduleName}: POST ${ROUTE_PATHS.adminUserCreate}`);

			try {
				const superAdminManager = new SuperAdminManager(c.env);
				const adminId = 'super_admin'; // 简化实现，使用固定ID
				const body = (await c.req.json()) as { uid: string; config: UserConfig };

				await superAdminManager.createUser(body.uid, body.config, adminId);

				return c.json({
					code: ResponseCodes.SUCCESS,
					msg: '用户创建成功',
					data: {
						message: '用户创建成功',
						uid: body.uid,
					},
				});
			} catch (error) {
				const errorResponse = this.handleError(error, '创建用户');
				return c.json(errorResponse, 500) as any;
			}
		});

		// 获取所有用户路由
		app.openapi(adminGetUsersRoute, async (c) => {
			console.log(`✅ ${this.moduleName}: 获取所有用户`);

			try {
				const superAdminManager = new SuperAdminManager(c.env);
				const userSummaries = await superAdminManager.getUserSummaryList();
				
				return c.json({
					code: ResponseCodes.SUCCESS,
					msg: '获取所有用户成功',
					data: {
						users: userSummaries,
						count: userSummaries.length,
						timestamp: new Date().toISOString(),
					},
				});
			} catch (error) {
				const errorResponse = this.handleError(error, '获取所有用户');
				return c.json(errorResponse, 500) as any;
			}
		});
	}
}
