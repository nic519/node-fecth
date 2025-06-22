import { RouteHandler } from '@/types/routes.types';
import { SuperAdminManager, UserSummary, SuperAdminStats, ConfigTemplate } from '@/module/userManager/superAdminManager';
import { UserConfig } from '@/types/user.types';

export class SuperAdminHandler implements RouteHandler {
	canHandle(request: Request): boolean {
		const url = new URL(request.url);
		return url.pathname.startsWith('/api/admin/');
	}

	async handle(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;

		try {
			// 验证超级管理员权限
			const authResult = await this.authenticateSuperAdmin(request, env);
			if (!authResult.success) {
				return this.createErrorResponse(authResult.message, 401);
			}

			const adminManager = new SuperAdminManager(env);
			const adminId = 'super_admin'; // 简化实现，使用固定ID

			// 路由分发
			switch (true) {
				// 系统统计
				case path === '/api/admin/stats' && method === 'GET':
					return await this.getSystemStats(adminManager);

				// 用户管理
				case path === '/api/admin/users' && method === 'GET':
					return await this.getUsersList(adminManager);
				
				case path.match(/^\/api\/admin\/users\/([^\/]+)$/) && method === 'GET':
					const userId = path.split('/')[4];
					return await this.getUserDetails(adminManager, userId);

				case path.match(/^\/api\/admin\/users\/([^\/]+)$/) && method === 'PUT':
					const userIdToUpdate = path.split('/')[4];
					return await this.updateUserConfig(adminManager, userIdToUpdate, adminId, request);

				case path.match(/^\/api\/admin\/users\/([^\/]+)$/) && method === 'DELETE':
					const userIdToDelete = path.split('/')[4];
					return await this.deleteUser(adminManager, userIdToDelete, adminId);

				case path === '/api/admin/users' && method === 'POST':
					return await this.createUser(adminManager, adminId, request);

				case path === '/api/admin/users/batch' && method === 'POST':
					return await this.batchOperateUsers(adminManager, adminId, request);

				// 刷新用户流量信息
				case path.match(/^\/api\/admin\/users\/([^\/]+)\/traffic\/refresh$/) && method === 'POST':
					const userIdToRefresh = path.split('/')[4];
					return await this.refreshUserTraffic(adminManager, userIdToRefresh, adminId);

				// 配置模板管理
				case path === '/api/admin/templates' && method === 'GET':
					return await this.getConfigTemplates(adminManager);

				case path === '/api/admin/templates' && method === 'POST':
					return await this.createConfigTemplate(adminManager, request);

				case path.match(/^\/api\/admin\/templates\/([^\/]+)$/) && method === 'PUT':
					const templateIdToUpdate = path.split('/')[4];
					return await this.updateConfigTemplate(adminManager, templateIdToUpdate, request);

				case path.match(/^\/api\/admin\/templates\/([^\/]+)$/) && method === 'DELETE':
					const templateIdToDelete = path.split('/')[4];
					return await this.deleteConfigTemplate(adminManager, templateIdToDelete);

				case path.match(/^\/api\/admin\/templates\/([^\/]+)\/apply$/) && method === 'POST':
					const templateIdToApply = path.split('/')[4];
					return await this.applyTemplate(adminManager, templateIdToApply, adminId, request);

				// 操作日志
				case path === '/api/admin/logs' && method === 'GET':
					return await this.getAdminLogs(adminManager, url);

				// 健康检查
				case path === '/api/admin/health' && method === 'GET':
					return await this.getHealthStatus(adminManager);

				default:
					return this.createErrorResponse('API endpoint not found', 404);
			}
		} catch (error) {
			console.error('超级管理员API处理失败:', error);
			return this.createErrorResponse('Internal Server Error', 500);
		}
	}

	/**
	 * 验证超级管理员权限
	 */
	private async authenticateSuperAdmin(request: Request, env: Env): Promise<{ success: boolean, message: string }> {
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
	private async getSystemStats(adminManager: SuperAdminManager): Promise<Response> {
		try {
			const stats = await adminManager.getSystemStats();
			return this.createSuccessResponse(stats);
		} catch (error) {
			console.error('获取系统统计失败:', error);
			return this.createErrorResponse('Failed to get system stats', 500);
		}
	}

	/**
	 * 获取用户列表
	 */
	private async getUsersList(adminManager: SuperAdminManager): Promise<Response> {
		try {
			const users = await adminManager.getUserSummaryList();
			return this.createSuccessResponse({ users });
		} catch (error) {
			console.error('获取用户列表失败:', error);
			return this.createErrorResponse('Failed to get users list', 500);
		}
	}

	/**
	 * 获取用户详情
	 */
	private async getUserDetails(adminManager: SuperAdminManager, userId: string): Promise<Response> {
		try {
			// 这里需要从UserManager获取详细信息
			const userManager = (adminManager as any).userManager;
			const configResponse = await userManager.getUserConfig(userId);
			
			if (!configResponse) {
				return this.createErrorResponse('User not found', 404);
			}

			return this.createSuccessResponse({
				userId,
				config: configResponse.config,
				meta: configResponse.meta
			});
		} catch (error) {
			console.error('获取用户详情失败:', error);
			return this.createErrorResponse('Failed to get user details', 500);
		}
	}

	/**
	 * 更新用户配置
	 */
	private async updateUserConfig(
		adminManager: SuperAdminManager, 
		userId: string, 
		adminId: string, 
		request: Request
	): Promise<Response> {
		try {
			const body = await request.json() as { config: UserConfig };
			const userManager = (adminManager as any).userManager;
			
			await userManager.saveUserConfig(userId, body.config);
			
			return this.createSuccessResponse({ 
				message: '用户配置更新成功',
				userId 
			});
		} catch (error) {
			console.error('更新用户配置失败:', error);
			return this.createErrorResponse('Failed to update user config', 500);
		}
	}

	/**
	 * 删除用户
	 */
	private async deleteUser(adminManager: SuperAdminManager, userId: string, adminId: string): Promise<Response> {
		try {
			await adminManager.deleteUser(userId, adminId);
			return this.createSuccessResponse({ 
				message: '用户删除成功',
				userId 
			});
		} catch (error) {
			console.error('删除用户失败:', error);
			return this.createErrorResponse('Failed to delete user', 500);
		}
	}

	/**
	 * 创建用户
	 */
	private async createUser(adminManager: SuperAdminManager, adminId: string, request: Request): Promise<Response> {
		try {
			const body = await request.json() as { userId: string, config: UserConfig };
			await adminManager.createUser(body.userId, body.config, adminId);
			
			return this.createSuccessResponse({ 
				message: '用户创建成功',
				userId: body.userId 
			});
		} catch (error) {
			console.error('创建用户失败:', error);
			const errorMessage = error instanceof Error ? error.message : '创建用户失败';
			return this.createErrorResponse(errorMessage, 500);
		}
	}

	/**
	 * 批量操作用户
	 */
	private async batchOperateUsers(adminManager: SuperAdminManager, adminId: string, request: Request): Promise<Response> {
		try {
			const body = await request.json() as { 
				userIds: string[], 
				operation: 'delete' | 'disable' | 'enable' 
			};
			
			const result = await adminManager.batchOperateUsers(body.userIds, body.operation, adminId);
			
			return this.createSuccessResponse({ 
				message: '批量操作完成',
				result 
			});
		} catch (error) {
			console.error('批量操作失败:', error);
			return this.createErrorResponse('Failed to batch operate users', 500);
		}
	}

	/**
	 * 刷新用户流量信息
	 */
	private async refreshUserTraffic(adminManager: SuperAdminManager, userId: string, adminId: string): Promise<Response> {
		try {
			const trafficInfo = await adminManager.refreshUserTrafficInfo(userId, adminId);
			
			return this.createSuccessResponse({ 
				message: '流量信息刷新成功',
				userId,
				trafficInfo
			});
		} catch (error) {
			console.error('刷新用户流量信息失败:', error);
			const errorMessage = error instanceof Error ? error.message : '刷新流量信息失败';
			return this.createErrorResponse(errorMessage, 500);
		}
	}

	/**
	 * 获取配置模板列表
	 */
	private async getConfigTemplates(adminManager: SuperAdminManager): Promise<Response> {
		try {
			const templates = await adminManager.getConfigTemplates();
			return this.createSuccessResponse({ templates });
		} catch (error) {
			console.error('获取配置模板失败:', error);
			return this.createErrorResponse('Failed to get config templates', 500);
		}
	}

	/**
	 * 创建配置模板
	 */
	private async createConfigTemplate(adminManager: SuperAdminManager, request: Request): Promise<Response> {
		try {
			const body = await request.json() as Omit<ConfigTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>;
			const template = await adminManager.createConfigTemplate(body);
			
			return this.createSuccessResponse({ 
				message: '配置模板创建成功',
				template 
			});
		} catch (error) {
			console.error('创建配置模板失败:', error);
			return this.createErrorResponse('Failed to create config template', 500);
		}
	}

	/**
	 * 更新配置模板
	 */
	private async updateConfigTemplate(adminManager: SuperAdminManager, templateId: string, request: Request): Promise<Response> {
		// 简化实现 - 实际需要实现模板更新逻辑
		return this.createErrorResponse('Template update not implemented yet', 501);
	}

	/**
	 * 删除配置模板
	 */
	private async deleteConfigTemplate(adminManager: SuperAdminManager, templateId: string): Promise<Response> {
		// 简化实现 - 实际需要实现模板删除逻辑
		return this.createErrorResponse('Template deletion not implemented yet', 501);
	}

	/**
	 * 应用模板到用户
	 */
	private async applyTemplate(
		adminManager: SuperAdminManager, 
		templateId: string, 
		adminId: string, 
		request: Request
	): Promise<Response> {
		try {
			const body = await request.json() as { userId: string };
			await adminManager.applyTemplateToUser(templateId, body.userId, adminId);
			
			return this.createSuccessResponse({ 
				message: '模板应用成功',
				templateId,
				userId: body.userId 
			});
		} catch (error) {
			console.error('应用模板失败:', error);
			const errorMessage = error instanceof Error ? error.message : '应用模板失败';
			return this.createErrorResponse(errorMessage, 500);
		}
	}

	/**
	 * 获取操作日志
	 */
	private async getAdminLogs(adminManager: SuperAdminManager, url: URL): Promise<Response> {
		try {
			const date = url.searchParams.get('date') || undefined;
			const limit = parseInt(url.searchParams.get('limit') || '100');
			
			const logs = await adminManager.getAdminLogs(date, limit);
			
			return this.createSuccessResponse({ logs });
		} catch (error) {
			console.error('获取操作日志失败:', error);
			return this.createErrorResponse('Failed to get admin logs', 500);
		}
	}

	/**
	 * 获取系统健康状态
	 */
	private async getHealthStatus(adminManager: SuperAdminManager): Promise<Response> {
		try {
			const stats = await adminManager.getSystemStats();
			const health = {
				status: 'healthy',
				timestamp: new Date().toISOString(),
				stats: {
					totalUsers: stats.totalUsers,
					activeUsers: stats.activeUsers,
					configCompleteRate: stats.configCompleteRate
				}
			};
			
			return this.createSuccessResponse(health);
		} catch (error) {
			console.error('获取健康状态失败:', error);
			return this.createErrorResponse('Failed to get health status', 500);
		}
	}

	/**
	 * 创建成功响应
	 */
	private createSuccessResponse(data: any): Response {
		return new Response(JSON.stringify({
			success: true,
			data
		}), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type'
			}
		});
	}

	/**
	 * 创建错误响应
	 */
	private createErrorResponse(message: string, status: number = 400): Response {
		return new Response(JSON.stringify({
			success: false,
			error: message
		}), {
			status,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type'
			}
		});
	}
} 