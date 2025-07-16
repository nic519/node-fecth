import { UserManager } from '@/module/userManager/userManager';
import { UserConfig, UserConfigSchema } from '@/types/openapi-schemas';
import { RouteHandler } from '@/types/routes.types';
import { AuthUtils } from '@/utils/authUtils';

export class UserConfigHandler implements RouteHandler {
	canHandle(request: Request): boolean {
		const url = new URL(request.url);
		return url.pathname.startsWith('/api/config/user/');
	}

	async handle(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const method = request.method;

		console.log(`🔧 用户配置管理请求: ${method} ${pathname}`);

		try {
			// 解析路径参数
			const pathParts = pathname.split('/').filter(Boolean);

			// 路由匹配: /api/config/users/:userId
			if (pathParts[0] === 'api' && pathParts[1] === 'config' && pathParts[2] === 'users') {
				const userId = pathParts[3]; // 可选的用户ID
				if (method === 'POST' && userId) {
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
	async getUserConfig(request: Request, env: Env, userId: string): Promise<Response> {
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
	 * 更新用户配置
	 */
	async updateUserConfig(request: Request, env: Env, userId: string): Promise<Response> {
		try {
			// 身份验证
			const authResult = await AuthUtils.authenticate(request, env, userId);

			// 解析请求体
			const body = (await request.json()) as { config?: UserConfig; yaml?: string };
			let config: UserConfig;

			if (body.config) {
				// 处理前端发送的JSON格式配置
				config = body.config;
			} else if (body.yaml) {
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
			try {
				UserConfigSchema.parse(config);
			} catch (error: any) {
				const errorMessage = error.errors?.map((e: any) => e.message).join('\n') || 'Invalid config format';
				return AuthUtils.createErrorResponse(errorMessage, 400);
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
	 * 创建用户配置
	 */
	private async createUserConfig(request: Request, env: Env, userId: string): Promise<Response> {
		try {
			// 验证超级管理员权限 (创建用户需要管理员权限)
			const url = new URL(request.url);
			const superToken = url.searchParams.get('superToken');
			if (!superToken || superToken !== env.SUPER_ADMIN_TOKEN) {
				return AuthUtils.createErrorResponse('Unauthorized: Super admin token required for user creation', 401);
			}

			// 检查用户是否已存在
			const userManager = new UserManager(env);
			const existingUser = await userManager.getUserConfig(userId);
			if (existingUser) {
				return AuthUtils.createErrorResponse('Conflict: User already exists', 409);
			}

			// 解析请求体
			const body = (await request.json()) as { config?: UserConfig; yaml?: string };
			let config: UserConfig;

			if (body.config) {
				// 处理前端发送的JSON格式配置
				config = body.config;
			} else if (body.yaml) {
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
			try {
				UserConfigSchema.parse(config);
			} catch (error: any) {
				const errorMessage = error.errors?.map((e: any) => e.message).join('\n') || 'Invalid config format';
				return AuthUtils.createErrorResponse(errorMessage, 400);
			}

			// 创建用户配置
			const success = await userManager.saveUserConfig(userId, config);
			if (!success) {
				return AuthUtils.createErrorResponse('Failed to create user config', 500);
			}

			// 返回201状态码表示资源已创建
			return new Response(
				JSON.stringify({
					message: 'User created successfully',
					userId,
					config,
					timestamp: new Date().toISOString(),
				}),
				{
					status: 201,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
						'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
						'Access-Control-Allow-Headers': 'Content-Type, Authorization',
					},
				}
			);
		} catch (error) {
			console.error(`创建用户配置失败: ${userId}`, error);
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

	/**
	 * 获取所有用户列表
	 */
	private async getAllUsers(request: Request, env: Env): Promise<Response> {
		try {
			// 验证超级管理员权限
			const url = new URL(request.url);
			const superToken = url.searchParams.get('superToken');
			if (!superToken || superToken !== env.SUPER_ADMIN_TOKEN) {
				return AuthUtils.createErrorResponse('Unauthorized: Invalid super admin token', 401);
			}

			const userManager = new UserManager(env);
			const userList = await userManager.getAllUsers();

			return AuthUtils.createSuccessResponse({
				users: userList,
				count: userList.length,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error('获取所有用户列表失败:', error);
			return AuthUtils.createErrorResponse('Internal Server Error', 500);
		}
	}
}
