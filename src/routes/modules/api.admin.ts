import { TemplateManager } from '@/module/templateManager/templateManager';
import { SuperAdminManager } from '@/module/userManager/superAdminManager';
import { BaseAPI } from '@/routes/modules/base/api.base';
import {
	MyRouter,
	adminDeleteUserRoute,
	adminGetUsersRoute,
	adminUserCreateRoute,
	applyTemplateRoute,
	createConfigTemplateRoute,
	deleteConfigTemplateRoute,
	getConfigTemplatesRoute,
	updateConfigTemplateRoute,
} from '@/routes/openapi';
import { ResponseCodes } from '@/types/openapi-schemas';
import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 管理员功能路由模块
 */
export class APIAdmin extends BaseAPI {
	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		// 先校验superToken
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

		// 删除用户配置路由
		app.openapi(adminDeleteUserRoute, async (c) => {
			// 从已验证的请求体中获取uid
			const body = c.req.valid('json');

			console.log(`🔧 ${this.moduleName}: DELETE ${body.uid}`);

			try {
				const adminId = 'super_admin'; // 简化实现，使用固定ID
				const superAdminManager = new SuperAdminManager(c.env);
				await superAdminManager.deleteUser(body.uid, adminId);

				return c.json({
					code: ResponseCodes.SUCCESS,
					msg: '用户删除成功',
					data: {
						message: '用户删除成功',
						uid: body.uid,
					},
				});
			} catch (error) {
				const errorResponse = this.handleError(error, '删除用户配置');
				return c.json(errorResponse, 500) as any;
			}
		});

		// 创建用户路由
		app.openapi(adminUserCreateRoute, async (c) => {
			console.log(`🆕 ${this.moduleName}: POST ${MyRouter.adminUserCreate}`);

			try {
				const superAdminManager = new SuperAdminManager(c.env);
				const adminId = 'super_admin'; // 简化实现，使用固定ID
				const body = c.req.valid('json');

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

		// =============================================================================
		// 模板管理路由
		// =============================================================================

		// 获取所有配置模板
		app.openapi(getConfigTemplatesRoute, async (c) => {
			console.log(`📋 ${this.moduleName}: 获取所有配置模板`);

			try {
				const templateManager = new TemplateManager(c.env);
				const templates = await templateManager.getAllTemplates();

				return c.json({
					code: ResponseCodes.SUCCESS,
					msg: '获取模板成功',
					data: {
						templates,
					},
				});
			} catch (error) {
				const errorResponse = this.handleError(error, '获取模板列表');
				return c.json(errorResponse, 500) as any;
			}
		});

		// 创建配置模板
		app.openapi(createConfigTemplateRoute, async (c) => {
			console.log(`🆕 ${this.moduleName}: 创建配置模板`);

			try {
				const body = c.req.valid('json');
				const templateManager = new TemplateManager(c.env);
				const template = await templateManager.createTemplate({
					name: body.name,
					description: body.description,
					type: body.type,
					content: body.content,
					isActive: true,
					isDefault: false,
				});

				return c.json({
					code: ResponseCodes.SUCCESS,
					msg: '模板创建成功',
					data: template,
				});
			} catch (error) {
				const errorResponse = this.handleError(error, '创建模板');
				return c.json(errorResponse, 500) as any;
			}
		});

		// 更新配置模板
		app.openapi(updateConfigTemplateRoute, async (c) => {
			const templateId = c.req.param('templateId');
			console.log(`✏️ ${this.moduleName}: 更新配置模板 ${templateId}`);

			try {
				const body = c.req.valid('json');
				const templateManager = new TemplateManager(c.env);
				const template = await templateManager.updateTemplate(templateId, {
					name: body.name,
					description: body.description,
					type: body.type,
					content: body.content,
				});

				return c.json({
					code: ResponseCodes.SUCCESS,
					msg: '模板更新成功',
					data: template,
				});
			} catch (error) {
				const errorResponse = this.handleError(error, '更新模板');
				return c.json(errorResponse, 500) as any;
			}
		});

		// 删除配置模板
		app.openapi(deleteConfigTemplateRoute, async (c) => {
			const templateId = c.req.param('templateId');
			console.log(`🗑️ ${this.moduleName}: 删除配置模板 ${templateId}`);

			try {
				const templateManager = new TemplateManager(c.env);
				await templateManager.deleteTemplate(templateId);

				return c.json({
					code: ResponseCodes.SUCCESS,
					msg: '模板删除成功',
					data: {
						templateId,
					},
				});
			} catch (error) {
				const errorResponse = this.handleError(error, '删除模板');
				return c.json(errorResponse, 500) as any;
			}
		});

		// 应用模板到用户
		app.openapi(applyTemplateRoute, async (c) => {
			const templateId = c.req.param('templateId');
			console.log(`🔧 ${this.moduleName}: 应用模板 ${templateId} 到用户`);

			try {
				const body = c.req.valid('json');
				const templateManager = new TemplateManager(c.env);
				const templateUrl = await templateManager.applyTemplateToUser(templateId, body.uid);

				return c.json({
					code: ResponseCodes.SUCCESS,
					msg: '模板应用成功',
					data: {
						templateUrl,
						uid: body.uid,
						templateId,
					},
				});
			} catch (error) {
				const errorResponse = this.handleError(error, '应用模板');
				return c.json(errorResponse, 500) as any;
			}
		});

		// 获取模板订阅URL
		app.get('/api/admin/templates/:templateId/subscribe', async (c) => {
			const templateId = c.req.param('templateId');
			const superToken = c.req.query('superToken') || '';

			// 验证管理员权限
			const superAdminManager = new SuperAdminManager(c.env);
			const authResult = await superAdminManager.validateSuperAdmin(superToken);
			if (!authResult) {
				return c.json(
					{
						code: ResponseCodes.UNAUTHORIZED,
						msg: '超级管理员令牌无效',
					},
					401
				);
			}

			try {
				const templateManager = new TemplateManager(c.env);
				const template = await templateManager.getTemplateById(templateId);

				if (!template) {
					return c.json(
						{
							code: ResponseCodes.NOT_FOUND,
							msg: '模板不存在',
						},
						404
					);
				}

				// 生成订阅URL - 使用模板预览端点
				const baseUrl = c.req.url.split('/api/admin')[0];
				const subscribeUrl = `${baseUrl}/api/subscription/template/${templateId}`;

				return c.json({
					code: ResponseCodes.SUCCESS,
					msg: '获取订阅URL成功',
					data: {
						subscribeUrl,
						templateId,
						templateName: template.name,
					},
				});
			} catch (error) {
				const errorResponse = this.handleError(error, '获取订阅URL');
				return c.json(errorResponse, 500) as any;
			}
		});
	}
}
