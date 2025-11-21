import { createCRUDHandlers } from '@/db/crud-api-factory';
import { templates, type Template } from '@/db/schema';
import { BaseAPI } from '@/routes/modules/base/api.base';
import { RTemplateCreate, RTemplateDelete, RTemplatesList, RTemplateUpdate } from '@/routes/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 管理员模板功能路由模块
 * 使用 CRUD 工厂自动生成标准 CRUD 操作
 */
export class APIAdminTemplate extends BaseAPI {
	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		// 🎯 使用工厂自动生成标准 CRUD 处理器
		const crudHandlers = createCRUDHandlers<Template>({
			table: templates,
			resourceName: '模板',
			idParamName: 'templateId',
			dataKey: 'templates',
		});

		// 📋 注册标准 CRUD 路由（前端实际使用）
		app.openapi(RTemplatesList, crudHandlers.list);
		app.openapi(RTemplateCreate, crudHandlers.create);
		app.openapi(RTemplateUpdate, crudHandlers.update);
		app.openapi(RTemplateDelete, crudHandlers.delete);
	}
}
