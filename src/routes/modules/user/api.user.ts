import { createCRUDHandlers, type CRUDHooks } from '@/db/crud-api-factory';
import { users, type User } from '@/db/schema';
import { BaseAPI } from '@/routes/modules/base/api.base';
import { getUserRoute, updateUserRoute } from '@/routes/modules/user/method.user';
import { IScUserApiModel } from '@/routes/modules/user/schema.user';
import { userAuthHook } from '@/routes/modules/user/user.hooks';
import { userTransformer } from '@/routes/modules/user/user.transformer';
import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 用户配置路由模块
 * 使用 CRUD 工厂自动生成标准 CRUD 操作（需要用户身份验证）
 */
export class APIUser extends BaseAPI {
	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		console.log(`🔧 ${this.moduleName}: 开始注册用户路由...`);

		// 🎯 使用工厂自动生成 CRUD 处理器（带身份验证钩子）
		const crudHandlers = createCRUDHandlers<User, IScUserApiModel>({
			table: users,
			resourceName: '用户',
			idParamName: 'uid',
			idParamSource: 'query', // 从查询参数获取 uid
			transformer: userTransformer,
			hooks: {
				beforeEach: userAuthHook,
			} as CRUDHooks,
		});

		// 📋 注册标准 REST 路由
		app.openapi(getUserRoute, crudHandlers.get); // GET /api/user?uid=xxx&token=xxx
		app.openapi(updateUserRoute, crudHandlers.update); // PUT /api/user?uid=xxx&token=xxx
	}
}
