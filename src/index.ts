/**
 * Welcome to Cloudflare Workers!
 *
 * This is a template for a Scheduled Worker: a Worker that can run on a
 * configurable interval:
 * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` to see your Worker in action
 * - Run `npm run deploy` to publish your Worker
 *
 * Bind resources to your Worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { parse as yamlParse } from 'yaml';
import { ExecutionContext } from '@cloudflare/workers-types';
import { Env, getUserConfig, SUB_PARAMS, RESPONSE_HEADERS, DEFAULT_CONFIG, UserConfig } from './types';

class SubscriptionService {
	constructor(private env: Env) {}

	private validateToken(request: Request): { userId: string, config: UserConfig } | Response {
		const url = new URL(request.url);
		const userId = url.pathname.split('/')[1];
		const token = url.searchParams.get('token');
		
		console.log('userId:', userId);
		console.log('USER_CONFIGS:', JSON.stringify(this.env.USER_CONFIGS, null, 2));  // 完整打印配置
		
		if (userId === 'favicon.ico') {
			return new Response('Not Found', { status: 404 });
		}
		
		const userConfig = getUserConfig(this.env, userId);
		console.log('userConfig:', userConfig);
		console.log('Received token:', token);
		console.log('Expected token:', userConfig?.ACCESS_TOKEN);
		
		if (!userConfig || token !== userConfig.ACCESS_TOKEN) {
			return new Response('Unauthorized', { status: 401 });
		}

		return { userId, config: userConfig };
	}

	// 构建订阅URL
	private buildSubscriptionUrl(userId: string): string {
		const userConfig = getUserConfig(this.env, userId);
		const engineUrl = new URL(userConfig?.ENGINE || DEFAULT_CONFIG.ENGINE);
		const params = new URLSearchParams({
			target: SUB_PARAMS.target,
			url: userConfig?.SUB_URL || '',
			config: userConfig?.RULE_URL || DEFAULT_CONFIG.RULE_URL,
			...Object.fromEntries(
				Object.entries(SUB_PARAMS.options).map(([k, v]) => [k, String(v)])
			), 
			filename: SUB_PARAMS.filename
		});
		
		return `${engineUrl}?${params.toString()}`;
	}

	// 验证YAML格式
	private validateYaml(yaml: any): Response | null {
		if (!yaml) {
			return new Response("解析出的结果不是yaml格式", { 
				status: 500,
				headers: RESPONSE_HEADERS 
			});
		}
		if (!yaml.proxies || !Array.isArray(yaml.proxies) || yaml.proxies.length < 2) {
			return new Response("解析出的结果不符合clash的格式", { 
				status: 500,
				headers: RESPONSE_HEADERS 
			});
		}
		return null;
	}

	// 处理订阅请求
	async handleRequest(request: Request): Promise<Response> {
		// 验证令牌和获取用户ID
		const auth = this.validateToken(request);
		if (auth instanceof Response) return auth;

		try {
			// 获取并转换订阅内容
			const finalURL = this.buildSubscriptionUrl(auth.userId);
			console.log( auth.userId, finalURL);
			const response = await fetch(finalURL);
			const text = await response.text();
			
			// 验证YAML
			const yaml = yamlParse(text);
			const yamlError = this.validateYaml(yaml);
			if (yamlError) return yamlError;

			// 返回成功响应
			return new Response(text, {
				status: 200,
				headers: {
					...RESPONSE_HEADERS,
					'Subscription-Userinfo': response.headers.get('Subscription-Userinfo') || '',
					'Content-Disposition': `attachment; filename=${SUB_PARAMS.filename}.yaml`
				}
			});
		} catch (error) {
			console.error('Error:', error);
			return new Response("处理订阅时发生错误", { 
				status: 500,
				headers: RESPONSE_HEADERS 
			});
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