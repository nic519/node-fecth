import { UserManager } from '@/module/userManager/userManager';
import { RouteHandler } from '@/types/routes.types';
import { UserConfig } from '@/types/user-config.types';
import { AuthUtils } from '@/utils/authUtils';

export class UserConfigHandler implements RouteHandler {
	async handle(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const method = request.method;

		console.log(`🔧 用户配置管理请求: ${method} ${pathname}`);

		try {
					// 解析路径参数
		const pathParts = pathname.split('/').filter(Boolean);

		// 路由匹配: /api/config/allUsers - 获取所有用户列表
		if (pathParts[0] === 'api' && pathParts[1] === 'config' && pathParts[2] === 'allUsers') {
			if (method === 'GET') {
				return await this.getAllUsers(request, env);
			}
		}

		// 路由匹配: /api/config/users/:userId
		if (pathParts[0] === 'api' && pathParts[1] === 'config' && pathParts[2] === 'users') {
			const userId = pathParts[3]; // 可选的用户ID

			if (method === 'GET') {
				if (userId) {
					// GET /api/config/users/:userId - 获取指定用户配置
					return await this.getUserConfig(request, env, userId);
				} else {
					// GET /api/config/users - 获取所有用户列表
					return await this.getAllUsers(request, env);
				}
			} else if (method === 'POST' && userId) {
				// POST /api/config/users/:userId - 更新用户配置
				return await this.updateUserConfig(request, env, userId);
			} else if (method === 'DELETE' && userId) {
				// DELETE /api/config/users/:userId - 删除用户配置
				return await this.deleteUserConfig(request, env, userId);
			}
		}

			return new Response('Not Found', { status: 404 });
		} catch (error) {
			console.error('用户配置管理处理错误:', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	}

	/**
	 * 获取指定用户配置
	 */
	private async getUserConfig(request: Request, env: Env, userId: string): Promise<Response> {
		try {
			// 身份验证
			const authResult = await AuthUtils.authenticate(request, env, userId);
			return AuthUtils.createSuccessResponse(authResult);
		} catch (error) {
			console.error(`获取用户配置失败: ${userId}`, error);
			return AuthUtils.createErrorResponse('Internal Server Error', 500);
		}
	}

	/**
	 * 获取所有用户列表
	 */
	private async getAllUsers(request: Request, env: Env): Promise<Response> {
		try {
			// 身份验证（超级管理员权限）
			// 对于获取所有用户列表，我们需要验证 superToken
			const url = new URL(request.url);
			const superToken = url.searchParams.get('superToken') || 
				AuthUtils.getAccessToken(request);
			
			if (!superToken) {
				return AuthUtils.createErrorResponse('缺少超级管理员令牌', 401);
			}

			// 简单验证超级管理员令牌（实际项目中应该有更严格的验证）
			// 这里暂时使用简单的验证逻辑
			if (superToken !== '123' && superToken !== 'super-admin-token') {
				return AuthUtils.createErrorResponse('无效的超级管理员令牌', 403);
			}

			// 获取所有用户列表
			const userManager = new UserManager(env);
			const users = await userManager.getAllUsers();

			// 为每个用户获取基本信息
			const userList = await Promise.all(
				users.map(async (userId) => {
					try {
						const configResponse = await userManager.getUserConfig(userId);
						return {
							userId,
							hasConfig: !!configResponse,
							source: configResponse?.meta.source || 'none',
							lastModified: configResponse?.meta.lastModified || null,
						};
					} catch (error) {
						console.error(`获取用户 ${userId} 配置失败:`, error);
						// 返回基本用户信息
						return {
							userId,
							hasConfig: false,
							source: 'error',
							lastModified: null,
						};
					}
				})
			);

			return AuthUtils.createSuccessResponse({ users: userList });
		} catch (error) {
			console.error('获取用户列表失败', error);
			return AuthUtils.createErrorResponse('Internal Server Error', 500);
		}
	}

	/**
	 * 更新用户配置
	 */
	private async updateUserConfig(request: Request, env: Env, userId: string): Promise<Response> {
		try {
			// 身份验证
			const authResult = await AuthUtils.authenticate(request, env, userId);

			// 解析请求体
			const body = (await request.json()) as { yaml?: string };
			let config: UserConfig;

			if (body.yaml) {
				// 处理YAML格式的请求
				try {
					const { parse } = await import('yaml');
					config = parse(body.yaml) as UserConfig;
				} catch (error) {
					return AuthUtils.createErrorResponse('Bad Request: Invalid YAML format', 400);
				}
			} else {
				return AuthUtils.createErrorResponse('Bad Request: Missing config or yaml data', 400);
			}

			if (!config) {
				return AuthUtils.createErrorResponse('Bad Request: Invalid config data', 400);
			}

			// 使用Zod验证配置
			const { validateUserConfig } = await import('@/types/user-config.schema');
			const validation = validateUserConfig(config);

			if (!validation.isValid) {
				return AuthUtils.createErrorResponse(validation.errors.join('\n'), 400);
			}

			// 保存用户配置
			const userManager = new UserManager(env);
			const success = await userManager.saveUserConfig(userId, config);
			if (!success) {
				return AuthUtils.createErrorResponse('Failed to save user config', 500);
			}

			return AuthUtils.createSuccessResponse({
				message: 'User config saved successfully',
				userId,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error(`更新用户配置失败: ${userId}`, error);
			return AuthUtils.createErrorResponse('Internal Server Error', 500);
		}
	}

	/**
	 * 删除用户配置
	 */
	private async deleteUserConfig(request: Request, env: Env, userId: string): Promise<Response> {
		try {
			// 身份验证
			const authResult = await AuthUtils.authenticate(request, env, userId);

			const userManager = new UserManager(env);

			// 删除用户配置
			const success = await userManager.deleteUserConfig(userId);
			if (!success) {
				return AuthUtils.createErrorResponse('Failed to delete user config', 500);
			}

			return AuthUtils.createSuccessResponse({
				success: true,
				message: 'User config deleted successfully',
				userId,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error(`删除用户配置失败: ${userId}`, error);
			return AuthUtils.createErrorResponse('Internal Server Error', 500);
		}
	}
}
