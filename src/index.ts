import { ExecutionContext } from '@cloudflare/workers-types';
import { Env, getUserConfig, SUB_PARAMS, RESPONSE_HEADERS, DEFAULT_CONFIG, UserConfig } from './types/types';
import { NodeConverter } from './module/nodeConverter';
import { ConfigValidator } from './module/configValidator';
import { StorageHandler } from './routes/storageHandler';
import { Routes } from './routes/routesConfig';
import { YamlMerge } from './module/yamlMerge';

class SubscriptionService {
	private nodeConverter = new NodeConverter();
	private configValidator = new ConfigValidator();
	
	constructor(private env: Env) {}

	/**
	 * 验证token
	 * @param uid 用户id
	 * @param token 访问token
	 * @returns 用户配置或401响应
	 */
	private validateToken(uid: string, token: string | null): UserConfig | Response {
		if (!uid || !token) {
			return new Response('Unauthorized', { status: 401 });
		}
		const userConfig = getUserConfig(this.env, uid); 
		if (!userConfig || token !== userConfig.ACCESS_TOKEN) {
			return new Response('Unauthorized', { status: 401 });
		}
		return userConfig
	}

	// 构建订阅URL（去第三方的转换引擎的网址）
	private buildSubscriptionUrl(userConfig: UserConfig, target: string = 'clash'): string {
		const engineUrl = new URL(userConfig?.ENGINE || DEFAULT_CONFIG.ENGINE);
		const params = new URLSearchParams({
			target,
			url: userConfig?.SUB_URL || '',
			config: userConfig?.RULE_URL || DEFAULT_CONFIG.RULE_URL,
			...Object.fromEntries(
				Object.entries(SUB_PARAMS.options).map(([k, v]) => [k, String(v)])
			)
		});
		
		return `${engineUrl}?${params.toString()}`;
	}
 
	// 处理订阅请求
	async handleRequest(request: Request): Promise<Response> {
		try {
			const url = new URL(request.url);

			// 先尝试处理存储路由
			if (url.pathname === Routes.storage) {
				const storageResponse = await StorageHandler.handle(request);
				if (storageResponse) return storageResponse;
			}
			
			// 验证token
			const uid = url.pathname.slice(1);
			const token = url.searchParams.get('token');
			const authConfig = this.validateToken(uid, token);
			if (authConfig instanceof Response) return authConfig;
 
			const target = url.searchParams.get('target') || 'clash'; 
			const yamlMerge = new YamlMerge(authConfig.RULE_URL);
			const {yamlContent, subInfo} = await yamlMerge.merge(authConfig.RULE_URL!, authConfig.SUB_URL);
			
			// 使用配置验证器验证格式
			const formatError = this.configValidator.validate(yamlContent, target);
			if (formatError) return formatError;

			return new Response(yamlContent, {
				status: 200,
				headers: {
					...RESPONSE_HEADERS,
					'Content-Type': target === 'clash' ? 'text/yaml; charset=utf-8' : 'application/json; charset=utf-8',
					'Subscription-Userinfo': subInfo,
					'Content-Disposition': `attachment; filename=${authConfig.FILE_NAME}.${target === 'clash' ? 'yaml' : 'json'}`
				}
			});
		} catch (error) {
			console.error('Error:', error);
			return new Response("处理订阅时发生错误", { status: 500 });
		}
	}
}

// Worker 入口
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const service = new SubscriptionService(env);
		return service.handleRequest(request);
	}
};