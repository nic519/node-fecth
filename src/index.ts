import { ExecutionContext } from '@cloudflare/workers-types';
import { Env, getUserConfig, SUB_PARAMS, RESPONSE_HEADERS, DEFAULT_CONFIG, UserConfig } from './types/types';
import { NodeConverter } from './module/nodeConverter';
import { ConfigValidator } from './module/configValidator';
import { StorageHandler } from './routes/storageHandler';
import { Routes } from './routes/routesConfig';

class SubscriptionService {
	private nodeConverter = new NodeConverter();
	private configValidator = new ConfigValidator();
	
	constructor(private env: Env) {}

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

	// 构建订阅URL
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

			// 开始处理订阅获取
			const target = url.searchParams.get('target') || 'clash';
			
			const finalURL = this.buildSubscriptionUrl(authConfig, target);
			const { text, headers } = await this.nodeConverter.convert(
				request,
				authConfig.SUB_URL,
				finalURL,
				'clash 1.10.0'
			);
			
			// 使用配置验证器验证格式
			const formatError = this.configValidator.validate(text, target);
			if (formatError) return formatError;

			return new Response(text, {
				status: 200,
				headers: {
					...RESPONSE_HEADERS,
					'Content-Type': target === 'clash' ? 'text/yaml; charset=utf-8' : 'application/json; charset=utf-8',
					'Subscription-Userinfo': headers['subscription-userinfo'] || '',
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