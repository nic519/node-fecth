import { getDb } from '@/db';
import { templates, type Template } from '@/db/schema';
import { SuperAdminManager } from '@/module/userManager/superAdminManager';
import { BaseAPI } from '@/routes/modules/base/api.base';
import {
	applyTemplateRoute,
	createConfigTemplateRoute,
	deleteConfigTemplateRoute,
	getConfigTemplatesRoute,
	updateConfigTemplateRoute,
} from '@/routes/openapi';
import { ConfigTemplate, ResponseCodes } from '@/types/openapi-schemas';
import { OpenAPIHono } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

/**
 * 数据库行转换为 API 格式
 */
const toApiFormat = (row: Template): ConfigTemplate => ({
	id: row.id,
	name: row.name,
	description: row.description,
	content: row.content,
	createdAt: row.createdAt,
	updatedAt: row.updatedAt,
});

/**
 * 管理员模板功能路由模块
 * 直接使用 Drizzle ORM 操作 D1 数据库 - 极简 CRUD
 */
export class APIAdminTemplate extends BaseAPI {
	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		// 📋 查询所有
		app.openapi(getConfigTemplatesRoute, async (c) => {
			try {
				const db = getDb(c.env);
				const result = await db.select().from(templates);
				return c.json({
					code: ResponseCodes.SUCCESS,
					msg: '获取模板成功',
					data: { templates: result.map(toApiFormat) },
				});
			} catch (error) {
				return c.json(this.handleError(error, '获取模板列表'), 500) as any;
			}
		});

		// 🆕 创建
		app.openapi(createConfigTemplateRoute, async (c) => {
			try {
				const body = c.req.valid('json');
				const db = getDb(c.env);
				const now = new Date().toISOString();
				const newTemplate = { id: Date.now().toString(), ...body, createdAt: now, updatedAt: now };

				await db.insert(templates).values(newTemplate);

				return c.json({
					code: ResponseCodes.SUCCESS,
					msg: '模板创建成功',
					data: toApiFormat(newTemplate),
				});
			} catch (error) {
				return c.json(this.handleError(error, '创建模板'), 500) as any;
			}
		});

		// ✏️ 更新
		app.openapi(updateConfigTemplateRoute, async (c) => {
			try {
				const id = c.req.param('templateId');
				const body = c.req.valid('json');
				const db = getDb(c.env);

				const [existing] = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
				if (!existing) return c.json({ code: ResponseCodes.NOT_FOUND, msg: '模板不存在' }, 404) as any;

				const now = new Date().toISOString();
				await db
					.update(templates)
					.set({ ...body, updatedAt: now })
					.where(eq(templates.id, id));

				return c.json({
					code: ResponseCodes.SUCCESS,
					msg: '模板更新成功',
					data: toApiFormat({ ...existing, ...body, updatedAt: now }),
				});
			} catch (error) {
				return c.json(this.handleError(error, '更新模板'), 500) as any;
			}
		});

		// 🗑️ 删除
		app.openapi(deleteConfigTemplateRoute, async (c) => {
			try {
				const id = c.req.param('templateId');
				const db = getDb(c.env);

				const [existing] = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
				if (!existing) return c.json({ code: ResponseCodes.NOT_FOUND, msg: '模板不存在' }, 404) as any;

				await db.delete(templates).where(eq(templates.id, id));

				return c.json({
					code: ResponseCodes.SUCCESS,
					msg: '模板删除成功',
					data: { templateId: id },
				});
			} catch (error) {
				return c.json(this.handleError(error, '删除模板'), 500) as any;
			}
		});

		// 🔧 应用模板到用户
		app.openapi(applyTemplateRoute, async (c) => {
			try {
				const id = c.req.param('templateId');
				const { uid } = c.req.valid('json');
				const db = getDb(c.env);

				const [template] = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
				if (!template) return c.json({ code: ResponseCodes.NOT_FOUND, msg: '模板不存在' }, 404) as any;

				const baseUrl = new URL(c.req.url).origin;
				const templateUrl = `${baseUrl}/api/subscription?token=${uid}&template=${id}`;

				return c.json({
					code: ResponseCodes.SUCCESS,
					msg: '模板应用成功',
					data: { templateUrl, uid, templateId: id },
				});
			} catch (error) {
				return c.json(this.handleError(error, '应用模板'), 500) as any;
			}
		});

		// 🔗 获取订阅URL
		app.get('/api/admin/templates/:templateId/subscribe', async (c) => {
			try {
				const id = c.req.param('templateId');
				const superToken = c.req.query('superToken') || '';

				const superAdminManager = new SuperAdminManager(c.env);
				if (!(await superAdminManager.validateSuperAdmin(superToken))) {
					return c.json({ code: ResponseCodes.UNAUTHORIZED, msg: '超级管理员令牌无效' }, 401);
				}

				const db = getDb(c.env);
				const [template] = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
				if (!template) return c.json({ code: ResponseCodes.NOT_FOUND, msg: '模板不存在' }, 404);

				const baseUrl = new URL(c.req.url).origin;
				return c.json({
					code: ResponseCodes.SUCCESS,
					msg: '获取订阅URL成功',
					data: {
						subscribeUrl: `${baseUrl}/api/subscription/template/${id}`,
						templateId: id,
						templateName: template.name,
					},
				});
			} catch (error) {
				return c.json(this.handleError(error, '获取订阅URL'), 500) as any;
			}
		});
	}
}
