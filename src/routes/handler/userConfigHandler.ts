import { RouteHandler } from '@/types/routes.types';
import { UserManager, UserConfigResponse } from '@/module/userManager/userManager';
import { UserConfig } from '@/types/user-config.schema';

export class UserConfigHandler implements RouteHandler {
	async handle(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const method = request.method;

		console.log(`🔧 用户配置管理请求: ${method} ${pathname}`);

		try {
			// 解析路径参数
			const pathParts = pathname.split('/').filter(Boolean);

			// 路由匹配
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
			// 验证访问令牌
			const accessToken = this.getAccessToken(request);
			if (!accessToken) {
				return new Response('Unauthorized: Missing access token', { status: 401 });
			}

			const userManager = new UserManager(env);

			// 验证用户权限
			if (!userManager.validateUserPermission(userId, accessToken)) {
				return new Response('Forbidden: Invalid access token', { status: 403 });
			}

			// 检查请求格式参数
			const url = new URL(request.url);
			const format = url.searchParams.get('format');

			if (format === 'yaml') {
				// 返回YAML格式
				const yamlResponse = await userManager.getUserConfigYaml(userId);
				if (!yamlResponse) {
					return new Response('User config not found', { status: 404 });
				}

				return new Response(
					JSON.stringify({
						yaml: yamlResponse.yaml,
						meta: yamlResponse.meta,
					}),
					{
						status: 200,
						headers: {
							'Content-Type': 'application/json',
							'Access-Control-Allow-Origin': '*',
							'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
							'Access-Control-Allow-Headers': 'Content-Type, Authorization',
						},
					}
				);
			} else {
				// 返回JSON格式（默认）
				const configResponse = await userManager.getUserConfig(userId);
				if (!configResponse) {
					return new Response('User config not found', { status: 404 });
				}

				return new Response(JSON.stringify(configResponse), {
					status: 200,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
						'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
						'Access-Control-Allow-Headers': 'Content-Type, Authorization',
					},
				});
			}
		} catch (error) {
			console.error(`获取用户配置失败: ${userId}`, error);
			return new Response('Internal Server Error', { status: 500 });
		}
	}

	/**
	 * 获取所有用户列表
	 */
	private async getAllUsers(request: Request, env: Env): Promise<Response> {
		try {
			// 验证访问令牌（超级管理员权限）
			const accessToken = this.getAccessToken(request);
			if (!accessToken) {
				return new Response('Unauthorized: Missing access token', { status: 401 });
			}

			const userManager = new UserManager(env);

			// 获取所有用户列表
			const users = await userManager.getAllUsers();

			// 为每个用户获取基本信息
			const userList = await Promise.all(
				users.map(async (userId) => {
					const configResponse = await userManager.getUserConfig(userId);
					return {
						userId,
						hasConfig: !!configResponse,
						source: configResponse?.meta.source || 'none',
						lastModified: configResponse?.meta.lastModified || null,
					};
				})
			);

			return new Response(JSON.stringify({ users: userList }), {
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
			});
		} catch (error) {
			console.error('获取用户列表失败', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	}

	/**
	 * 更新用户配置
	 */
	private async updateUserConfig(request: Request, env: Env, userId: string): Promise<Response> {
		try {
			// 验证访问令牌
			const accessToken = this.getAccessToken(request);
			if (!accessToken) {
				return new Response('Unauthorized: Missing access token', { status: 401 });
			}

			const userManager = new UserManager(env);

			// 验证用户权限
			if (!userManager.validateUserPermission(userId, accessToken)) {
				return new Response('Forbidden: Invalid access token', { status: 403 });
			}

			// 解析请求体
			const body = (await request.json()) as { config?: UserConfig; yaml?: string };
			let config: UserConfig;

			if (body.yaml) {
				// 处理YAML格式的请求
				try {
					const { parse } = await import('yaml');
					config = parse(body.yaml) as UserConfig;
				} catch (error) {
					return new Response('Bad Request: Invalid YAML format', { status: 400 });
				}
			} else if (body.config) {
				// 处理JSON格式的请求（向后兼容）
				config = body.config;
			} else {
				return new Response('Bad Request: Missing config or yaml data', { status: 400 });
			}

			if (!config) {
				return new Response('Bad Request: Invalid config data', { status: 400 });
			}

			// 保存用户配置
			const success = await userManager.saveUserConfig(userId, config);
			if (!success) {
				return new Response('Failed to save user config', { status: 500 });
			}

			return new Response(
				JSON.stringify({
					success: true,
					message: 'User config updated successfully',
					userId,
					timestamp: new Date().toISOString(),
				}),
				{
					status: 200,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
						'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
						'Access-Control-Allow-Headers': 'Content-Type, Authorization',
					},
				}
			);
		} catch (error) {
			console.error(`更新用户配置失败: ${userId}`, error);
			return new Response('Internal Server Error', { status: 500 });
		}
	}

	/**
	 * 删除用户配置
	 */
	private async deleteUserConfig(request: Request, env: Env, userId: string): Promise<Response> {
		try {
			// 验证访问令牌
			const accessToken = this.getAccessToken(request);
			if (!accessToken) {
				return new Response('Unauthorized: Missing access token', { status: 401 });
			}

			const userManager = new UserManager(env);

			// 验证用户权限
			if (!userManager.validateUserPermission(userId, accessToken)) {
				return new Response('Forbidden: Invalid access token', { status: 403 });
			}

			// 删除用户配置
			const success = await userManager.deleteUserConfig(userId);
			if (!success) {
				return new Response('Failed to delete user config', { status: 500 });
			}

			return new Response(
				JSON.stringify({
					success: true,
					message: 'User config deleted successfully',
					userId,
					timestamp: new Date().toISOString(),
				}),
				{
					status: 200,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
						'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
						'Access-Control-Allow-Headers': 'Content-Type, Authorization',
					},
				}
			);
		} catch (error) {
			console.error(`删除用户配置失败: ${userId}`, error);
			return new Response('Internal Server Error', { status: 500 });
		}
	}

	/**
	 * 从请求中提取访问令牌
	 */
	private getAccessToken(request: Request): string | null {
		// 从查询参数获取
		const url = new URL(request.url);
		const tokenFromQuery = url.searchParams.get('token');
		if (tokenFromQuery) return tokenFromQuery;

		// 从Authorization头获取
		const authHeader = request.headers.get('Authorization');
		if (authHeader && authHeader.startsWith('Bearer ')) {
			return authHeader.substring(7);
		}

		return null;
	}
}
