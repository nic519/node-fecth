import { SuperAdminManager } from '@/module/userManager/superAdminManager';
import { ConfigTemplate } from '@/module/userManager/types/supper-admin.types';
import { UserConfig } from '@/types/openapi-schemas';
import { RouteHandler } from '@/types/routes.types';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

export class SuperAdminHandler implements RouteHandler {
	private app: Hono<{ Bindings: Env }>;

	constructor() {
		this.app = new Hono<{ Bindings: Env }>();
		this.setupMiddleware();
		this.setupRoutes();
	}

	canHandle(request: Request): boolean {
		const url = new URL(request.url);
		return url.pathname.startsWith('/admin/');
	}

	async handle(request: Request, env: Env): Promise<Response> {
		// 创建一个新的 Hono 上下文并处理请求
		return this.app.fetch(request, env);
	}

	private setupMiddleware() {
		// CORS 中间件
		this.app.use(
			'*',
			cors({
				origin: '*',
				allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
				allowHeaders: ['Content-Type'],
			})
		);

		// 超级管理员权限验证中间件
		this.app.use('*', async (c, next) => {
			const authResult = await this.authenticateSuperAdmin(c.req.raw, c.env);
			if (!authResult.success) {
				return c.json(
					{
						success: false,
						error: authResult.message,
					},
					401
				);
			}
			await next();
		});
	}

	private setupRoutes() {
		// 系统统计
		this.app.get('/admin/stats', async (c) => {
			return await this.getSystemStats(c);
		});

		// 用户管理路由组
		const usersRoute = this.app.basePath('/admin/user');

		// 获取用户列表
		usersRoute.get('/all', async (c) => {
			return await this.getUsersList(c);
		});

		// 创建用户
		usersRoute.post('/create', async (c) => {
			return await this.createUser(c);
		});

		// 删除用户
		usersRoute.get('/delete/:uid', async (c) => {
			const uid = c.req.param('uid');
			return await this.deleteUser(c, uid);
		});

		// 刷新用户流量信息
		usersRoute.post('/:userId/traffic/refresh', async (c) => {
			const userId = c.req.param('userId');
			return await this.refreshUserTraffic(c, userId);
		});

		// 配置模板管理路由组
		const templatesRoute = this.app.basePath('/admin/templates');

		// 获取配置模板列表
		templatesRoute.get('/', async (c) => {
			return await this.getConfigTemplates(c);
		});

		// 创建配置模板
		templatesRoute.post('/', async (c) => {
			return await this.createConfigTemplate(c);
		});

		// 更新配置模板
		templatesRoute.put('/:templateId', async (c) => {
			const templateId = c.req.param('templateId');
			return await this.updateConfigTemplate(c, templateId);
		});

		// 删除配置模板
		templatesRoute.delete('/:templateId', async (c) => {
			const templateId = c.req.param('templateId');
			return await this.deleteConfigTemplate(c, templateId);
		});

		// 应用模板到用户
		templatesRoute.post('/:templateId/apply', async (c) => {
			const templateId = c.req.param('templateId');
			return await this.applyTemplate(c, templateId);
		});

		// 操作日志
		this.app.get('/admin/logs', async (c) => {
			return await this.getAdminLogs(c);
		});

		// 健康检查
		this.app.get('/admin/health', async (c) => {
			return await this.getHealthStatus(c);
		});
	}

	/**
	 * 验证超级管理员权限
	 */
	private async authenticateSuperAdmin(request: Request, env: Env): Promise<{ success: boolean; message: string }> {
		const url = new URL(request.url);
		const token = url.searchParams.get('superToken');

		if (!token) {
			return { success: false, message: '缺少超级管理员令牌' };
		}

		const adminManager = new SuperAdminManager(env);
		const isValid = await adminManager.validateSuperAdmin(token);

		if (!isValid) {
			return { success: false, message: '无效的超级管理员令牌' };
		}

		return { success: true, message: '验证成功' };
	}

	/**
	 * 获取系统统计数据
	 */
	private async getSystemStats(c: any): Promise<Response> {
		try {
			const adminManager = new SuperAdminManager(c.env);
			const stats = await adminManager.getSystemStats();
			return c.json({
				success: true,
				data: stats,
			});
		} catch (error) {
			console.error('获取系统统计失败:', error);
			return c.json(
				{
					success: false,
					error: 'Failed to get system stats',
				},
				500
			);
		}
	}

	/**
	 * 获取用户列表
	 */
	private async getUsersList(c: any): Promise<Response> {
		try {
			const adminManager = new SuperAdminManager(c.env);
			const users = await adminManager.getUserSummaryList();
			
			// 符合 UsersListResponseSchema 的响应格式
			return c.json({
				code: 0,
				msg: '获取用户列表成功',
				data: {
					users,
					count: users.length,
					timestamp: new Date().toISOString(),
				},
			});
		} catch (error) {
			console.error('获取用户列表失败:', error);
			return c.json(
				{
					code: 500,
					msg: '获取用户列表失败',
					data: null,
				},
				500
			);
		}
	}

	/**
	 * 删除用户
	 */
	private async deleteUser(c: any, uid: string): Promise<Response> {
		try {
			const adminManager = new SuperAdminManager(c.env);
			const adminId = 'super_admin'; // 简化实现，使用固定ID

			await adminManager.deleteUser(uid, adminId);
			return c.json({
				success: true,
				data: {
					message: '用户删除成功',
					uid,
				},
			});
		} catch (error) {
			console.error('删除用户失败:', error);
			return c.json(
				{
					success: false,
					error: 'Failed to delete user',
				},
				500
			);
		}
	}

	/**
	 * 创建用户
	 */
	private async createUser(c: any): Promise<Response> {
		try {
			const adminManager = new SuperAdminManager(c.env);
			const adminId = 'super_admin'; // 简化实现，使用固定ID
			const body = (await c.req.json()) as { userId: string; config: UserConfig };

			await adminManager.createUser(body.userId, body.config, adminId);

			return c.json({
				success: true,
				data: {
					message: '用户创建成功',
					userId: body.userId,
				},
			});
		} catch (error) {
			console.error('创建用户失败:', error);
			const errorMessage = error instanceof Error ? error.message : '创建用户失败';
			return c.json(
				{
					success: false,
					error: errorMessage,
				},
				500
			);
		}
	}

	/**
	 * 刷新用户流量信息
	 */
	private async refreshUserTraffic(c: any, userId: string): Promise<Response> {
		try {
			const adminManager = new SuperAdminManager(c.env);
			const adminId = 'super_admin'; // 简化实现，使用固定ID
			const trafficInfo = await adminManager.refreshUserTrafficInfo(userId, adminId);

			return c.json({
				success: true,
				data: {
					message: '流量信息刷新成功',
					userId,
					trafficInfo,
				},
			});
		} catch (error) {
			console.error('刷新用户流量信息失败:', error);
			const errorMessage = error instanceof Error ? error.message : '刷新流量信息失败';
			return c.json(
				{
					success: false,
					error: errorMessage,
				},
				500
			);
		}
	}

	/**
	 * 获取配置模板列表
	 */
	private async getConfigTemplates(c: any): Promise<Response> {
		try {
			const adminManager = new SuperAdminManager(c.env);
			const templates = await adminManager.getConfigTemplates();
			return c.json({
				success: true,
				data: { templates },
			});
		} catch (error) {
			console.error('获取配置模板失败:', error);
			return c.json(
				{
					success: false,
					error: 'Failed to get config templates',
				},
				500
			);
		}
	}

	/**
	 * 创建配置模板
	 */
	private async createConfigTemplate(c: any): Promise<Response> {
		try {
			const adminManager = new SuperAdminManager(c.env);
			const body = (await c.req.json()) as Omit<ConfigTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>;
			const template = await adminManager.createConfigTemplate(body);

			return c.json({
				success: true,
				data: {
					message: '配置模板创建成功',
					template,
				},
			});
		} catch (error) {
			console.error('创建配置模板失败:', error);
			return c.json(
				{
					success: false,
					error: 'Failed to create config template',
				},
				500
			);
		}
	}

	/**
	 * 更新配置模板
	 */
	private async updateConfigTemplate(c: any, templateId: string): Promise<Response> {
		// 简化实现 - 实际需要实现模板更新逻辑
		return c.json(
			{
				success: false,
				error: 'Template update not implemented yet',
			},
			501
		);
	}

	/**
	 * 删除配置模板
	 */
	private async deleteConfigTemplate(c: any, templateId: string): Promise<Response> {
		// 简化实现 - 实际需要实现模板删除逻辑
		return c.json(
			{
				success: false,
				error: 'Template deletion not implemented yet',
			},
			501
		);
	}

	/**
	 * 应用模板到用户
	 */
	private async applyTemplate(c: any, templateId: string): Promise<Response> {
		try {
			const adminManager = new SuperAdminManager(c.env);
			const adminId = 'super_admin'; // 简化实现，使用固定ID
			const body = (await c.req.json()) as { userId: string };

			await adminManager.applyTemplateToUser(templateId, body.userId, adminId);

			return c.json({
				success: true,
				data: {
					message: '模板应用成功',
					templateId,
					userId: body.userId,
				},
			});
		} catch (error) {
			console.error('应用模板失败:', error);
			const errorMessage = error instanceof Error ? error.message : '应用模板失败';
			return c.json(
				{
					success: false,
					error: errorMessage,
				},
				500
			);
		}
	}

	/**
	 * 获取操作日志
	 */
	private async getAdminLogs(c: any): Promise<Response> {
		try {
			const adminManager = new SuperAdminManager(c.env);
			const date = c.req.query('date') || undefined;
			const limit = parseInt(c.req.query('limit') || '100');

			const logs = await adminManager.getAdminLogs(date, limit);

			return c.json({
				success: true,
				data: { logs },
			});
		} catch (error) {
			console.error('获取操作日志失败:', error);
			return c.json(
				{
					success: false,
					error: 'Failed to get admin logs',
				},
				500
			);
		}
	}

	/**
	 * 获取系统健康状态
	 */
	private async getHealthStatus(c: any): Promise<Response> {
		try {
			const adminManager = new SuperAdminManager(c.env);
			const stats = await adminManager.getSystemStats();
			const health = {
				status: 'healthy',
				timestamp: new Date().toISOString(),
				stats: {
					totalUsers: stats.totalUsers,
					activeUsers: stats.activeUsers,
					configCompleteRate: stats.configCompleteRate,
				},
			};

			return c.json({
				success: true,
				data: health,
			});
		} catch (error) {
			console.error('获取健康状态失败:', error);
			return c.json(
				{
					success: false,
					error: 'Failed to get health status',
				},
				500
			);
		}
	}
}
