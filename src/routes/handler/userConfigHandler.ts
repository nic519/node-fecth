import { UserManager } from '@/module/userManager/userManager';
import { UserConfig, UserConfigSchema, ResponseCodes } from '@/types/openapi-schemas';
import { RouteHandler } from '@/types/routes.types';
import { AuthUtils } from '@/utils/authUtils';
import { ResponseUtils } from '@/utils/responseUtils';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

export class UserConfigHandler implements RouteHandler {
	private app: Hono<{ Bindings: Env }>;

	constructor() {
		this.app = new Hono<{ Bindings: Env }>();
		this.setupMiddleware();
		this.setupRoutes();
	}

	canHandle(request: Request): boolean {
		const url = new URL(request.url);
		console.log(`🔍 UserConfigHandler.canHandle 检查:`, {
			requestUrl: request.url,
			pathname: url.pathname,
			startsWith: url.pathname.startsWith('/config/user/'),
		});
		return url.pathname.startsWith('/config/user/');
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
				allowHeaders: ['Content-Type', 'Authorization'],
			})
		);

		// 全局错误处理中间件
		this.app.onError((err, c) => {
			console.error('UserConfigHandler 错误:', err);
			return ResponseUtils.jsonError(c, ResponseCodes.INTERNAL_ERROR, '服务器内部错误', {
				error: err.message,
			});
		});
	}

	private setupRoutes() {
		// 用户配置管理路由组
		const configRoute = this.app.basePath('/api/config/user');

		// 获取用户配置详情 - GET /config/user/detail/:uid
		configRoute.get('/detail/:uid', async (c) => {
			const uid = c.req.param('uid');
			console.log(`📖 处理获取用户详情: ${uid}`);
			return await this.getUserConfig(c, uid);
		});

		// 更新用户配置 - POST /config/user/update/:uid
		configRoute.post('/update/:uid', async (c) => {
			const uid = c.req.param('uid');
			console.log(`📝 处理更新用户配置: ${uid}`);
			return await this.updateUserConfig(c, uid);
		});

		// 创建用户配置 - POST /config/user/create/:uid
		configRoute.post('/create/:uid', async (c) => {
			const uid = c.req.param('uid');
			console.log(`➕ 处理创建用户配置: ${uid}`);
			return await this.createUserConfig(c, uid);
		});

		// 删除用户配置 - DELETE /config/user/delete/:uid
		configRoute.delete('/delete/:uid', async (c) => {
			const uid = c.req.param('uid');
			console.log(`🗑️ 处理删除用户配置: ${uid}`);
			return await this.deleteUserConfig(c, uid);
		});

		// 获取所有用户列表 - GET /config/user/all
		configRoute.get('/all', async (c) => {
			console.log(`📋 处理获取所有用户列表`);
			return await this.getAllUsers(c);
		});
	}

	/**
	 * 身份验证中间件
	 */
	private async authenticateUser(request: Request, env: Env, uid: string): Promise<{ success: boolean; message: string; data?: any }> {
		try {
			const authResult = await AuthUtils.authenticate(request, env, uid);
			return { success: true, message: '验证成功', data: authResult };
		} catch (error) {
			console.error(`❌ 身份验证失败: ${uid}`, error);
			return { 
				success: false, 
				message: `Authentication failed: ${error instanceof Error ? error.message : String(error)}` 
			};
		}
	}

	/**
	 * 获取指定用户配置
	 */
	private async getUserConfig(c: any, uid: string): Promise<Response> {
		try {
			// 身份验证
			const authResult = await this.authenticateUser(c.req.raw, c.env, uid);
			if (!authResult.success) {
				return ResponseUtils.jsonError(c, ResponseCodes.UNAUTHORIZED, authResult.message);
			}

			return ResponseUtils.success({
				config: authResult.data.config,
				meta: authResult.data.meta,
			}, '获取用户配置成功');
		} catch (error) {
			console.error(`获取用户配置失败: ${uid}`, error);
			return ResponseUtils.jsonError(c, ResponseCodes.INTERNAL_ERROR, '获取用户配置失败');
		}
	}

	/**
	 * 更新用户配置
	 */
	private async updateUserConfig(c: any, uid: string): Promise<Response> {
		try {
			console.log(`🔧 开始更新用户配置: ${uid}`);
			
			// 身份验证
			console.log(`🔐 开始身份验证: ${uid}`);
			const authResult = await this.authenticateUser(c.req.raw, c.env, uid);
			if (!authResult.success) {
				return ResponseUtils.jsonError(c, ResponseCodes.UNAUTHORIZED, authResult.message);
			}

			// 解析和验证配置
			const config = await this.parseAndValidateConfig(c);
			if (!config.success) {
				return ResponseUtils.jsonError(c, ResponseCodes.INVALID_PARAMS, config.message);
			}

			// 保存用户配置 (此时 config.success 为 true，所以 config.data 一定存在)
			const userManager = new UserManager(c.env);
			const success = await userManager.saveUserConfig(uid, (config as { success: true; data: UserConfig }).data);
			if (!success) {
				return ResponseUtils.jsonError(c, ResponseCodes.INTERNAL_ERROR, '保存用户配置失败');
			}

			return ResponseUtils.success({
				message: '用户配置保存成功',
				uid,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error(`❌ 更新用户配置失败: ${uid}`, error);
			console.error(`❌ 错误堆栈:`, error instanceof Error ? error.stack : error);
			
			// 根据错误类型返回不同的响应
			if (error instanceof SyntaxError) {
				console.error(`❌ JSON 解析错误:`, error.message);
				return ResponseUtils.jsonError(c, ResponseCodes.INVALID_PARAMS, 'JSON格式错误');
			}
			
			return ResponseUtils.jsonError(c, ResponseCodes.INTERNAL_ERROR, '更新用户配置失败');
		}
	}

	/**
	 * 创建用户配置
	 */
	private async createUserConfig(c: any, uid: string): Promise<Response> {
		try {
			// 验证超级管理员权限 (创建用户需要管理员权限)
			const url = new URL(c.req.url);
			const superToken = url.searchParams.get('superToken');
			if (!superToken || superToken !== c.env.SUPER_ADMIN_TOKEN) {
				return ResponseUtils.jsonError(c, ResponseCodes.UNAUTHORIZED, '需要超级管理员权限');
			}

			// 检查用户是否已存在
			const userManager = new UserManager(c.env);
			const existingUser = await userManager.getUserConfig(uid);
			if (existingUser) {
				return ResponseUtils.jsonError(c, ResponseCodes.CONFLICT, '用户已存在');
			}

			// 解析和验证配置
			const config = await this.parseAndValidateConfig(c);
			if (!config.success) {
				return ResponseUtils.jsonError(c, ResponseCodes.INVALID_PARAMS, config.message);
			}

			// 创建用户配置 (此时 config.success 为 true，所以 config.data 一定存在)
			const success = await userManager.saveUserConfig(uid, (config as { success: true; data: UserConfig }).data);
			if (!success) {
				return ResponseUtils.jsonError(c, ResponseCodes.INTERNAL_ERROR, '创建用户配置失败');
			}

			// 返回201状态码表示资源已创建
			return ResponseUtils.json(c, {
				message: 'User created successfully',
				uid,
				config: (config as { success: true; data: UserConfig }).data,
				timestamp: new Date().toISOString(),
			}, '用户创建成功', ResponseCodes.SUCCESS, 201);
		} catch (error) {
			console.error(`创建用户配置失败: ${uid}`, error);
			return ResponseUtils.jsonError(c, ResponseCodes.INTERNAL_ERROR, '创建用户配置失败');
		}
	}

	/**
	 * 删除用户配置
	 */
	private async deleteUserConfig(c: any, uid: string): Promise<Response> {
		try {
			// 身份验证
			const authResult = await this.authenticateUser(c.req.raw, c.env, uid);
			if (!authResult.success) {
				return ResponseUtils.jsonError(c, ResponseCodes.UNAUTHORIZED, authResult.message);
			}

			const userManager = new UserManager(c.env);

			// 删除用户配置
			const success = await userManager.deleteUserConfig(uid);
			if (!success) {
				return ResponseUtils.jsonError(c, ResponseCodes.INTERNAL_ERROR, '删除用户配置失败');
			}

			return ResponseUtils.success({
				message: '用户配置删除成功',
				uid,
				timestamp: new Date().toISOString(),
			}, '用户配置删除成功');
		} catch (error) {
			console.error(`删除用户配置失败: ${uid}`, error);
			return ResponseUtils.jsonError(c, ResponseCodes.INTERNAL_ERROR, '删除用户配置失败');
		}
	}

	/**
	 * 获取所有用户列表
	 */
	private async getAllUsers(c: any): Promise<Response> {
		try {
			// 验证超级管理员权限
			const url = new URL(c.req.url);
			const superToken = url.searchParams.get('superToken');
			if (!superToken || superToken !== c.env.SUPER_ADMIN_TOKEN) {
				return ResponseUtils.jsonError(c, ResponseCodes.UNAUTHORIZED, '无效的超级管理员令牌');
			}

			const userManager = new UserManager(c.env);
			const userList = await userManager.getAllUsers();

			return ResponseUtils.success({
				users: userList,
				count: userList.length,
				timestamp: new Date().toISOString(),
			}, '获取用户列表成功');
		} catch (error) {
			console.error('获取所有用户列表失败:', error);
			return ResponseUtils.jsonError(c, ResponseCodes.INTERNAL_ERROR, '获取用户列表失败');
		}
	}

	/**
	 * 解析和验证配置数据
	 */
	private async parseAndValidateConfig(c: any): Promise<{ success: true; data: UserConfig } | { success: false; message: string }> {
		try {
			console.log(`📦 开始解析请求体...`);
			const contentType = c.req.header('content-type');
			console.log(`📋 Content-Type: ${contentType}`);
			
			const body = (await c.req.json()) as { config?: UserConfig; yaml?: string };
			console.log(`📄 请求体内容:`, JSON.stringify(body, null, 2));
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
					return { success: false, message: 'Bad Request: Invalid YAML format' };
				}
			} else {
				return { success: false, message: 'Bad Request: Missing config or yaml data' };
			}

			if (!config) {
				return { success: false, message: 'Bad Request: Invalid config data' };
			}

			// 使用Zod验证配置
			try {
				UserConfigSchema.parse(config);
			} catch (error: any) {
				const errorMessage = error.errors?.map((e: any) => e.message).join('\n') || 'Invalid config format';
				return { success: false, message: errorMessage };
			}

			return { success: true, data: config };
		} catch (error) {
			console.error('解析配置失败:', error);
			return { success: false, message: 'Failed to parse config data' };
		}
	}
}
