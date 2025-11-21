import { createCRUDHandlers } from '@/db/crud-api-factory';
import { users, type User } from '@/db/schema';
import { SuperAdminManager } from '@/module/userManager/superAdminManager';
import { BaseAPI } from '@/routes/modules/base/api.base';
import { RUserCreate, RUserDelete, RUserGet, RUsersList, RUserUpdate } from '@/routes/modules/user/method.user-for-admin';
import { IScUserApiModel } from '@/routes/modules/user/schema.user';
import { userTransformer } from '@/routes/modules/user/user.transformer';
import { ResponseCodes } from '@/types/openapi-schemas';
import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 管理员用户管理路由模块
 * 使用 CRUD 工厂自动生成标准 CRUD 操作（需要超级管理员权限）
 */
export class APIUserForAdmin extends BaseAPI {
	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		console.log(`🔧 ${this.moduleName}: 开始注册管理员用户路由...`);

		app.use('/api/admin/*', async (c, next) => {
			const superAdminManager = new SuperAdminManager(c.env);
			const authResult = await superAdminManager.validateSuperAdmin(c.req.query('superToken') || '');
			if (!authResult) {
				return c.json(
					{
						code: ResponseCodes.UNAUTHORIZED,
						msg: '超级管理员令牌无效',
					},
					401
				);
			}

			await next();
		});

		// 🎯 使用工厂自动生成标准 CRUD 处理器（带数据转换器）
		const crudHandlers = createCRUDHandlers<User, IScUserApiModel>({
			table: users,
			resourceName: '用户',
			idParamName: 'uid',
			dataKey: 'users',
			transformer: userTransformer,
		});

		// 📋 注册标准 CRUD 路由
		app.openapi(RUsersList, crudHandlers.list); // GET /api/admin/users
		app.openapi(RUserGet, crudHandlers.get); // GET /api/admin/users/:uid
		app.openapi(RUserCreate, crudHandlers.create); // POST /api/admin/users
		app.openapi(RUserUpdate, crudHandlers.update); // PUT /api/admin/users/:uid
		app.openapi(RUserDelete, crudHandlers.delete); // DELETE /api/admin/users/:uid
	}
}
