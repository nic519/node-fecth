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
		
		if (userId === 'favicon.ico') {
			return new Response('Not Found', { status: 404 });
		}
		
		const userConfig = getUserConfig(this.env, userId); 
		
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
			filename: userConfig?.FILE_NAME || '123'
		});
		
		return `${engineUrl}?${params.toString()}`;
	}

	// 验证YAML格式
	private validateYaml(yaml: any): Response | null {
		if (!yaml) {
			return new Response("解析出的结果不是yaml格式", { 
				status: 500
			});
		}
		if (!yaml.proxies || !Array.isArray(yaml.proxies) || yaml.proxies.length < 2) {
			return new Response("解析出的结果不符合clash的格式", { 
				status: 500
			});
		}
		return null;
	}

	// 处理订阅请求
	async handleRequest(request: Request): Promise<Response> {
		const auth = this.validateToken(request);
		if (auth instanceof Response) return auth;

		try {
			// 直接获取转换后的订阅
			const finalURL = this.buildSubscriptionUrl(auth.userId);
			const response = await fetch(finalURL, {
				headers: {
					'User-Agent': 'Clash/1.0',
					'Accept': '*/*'
				}
			});
			
			// 打印响应头，看看转换后的信息
			// console.log('Converted response headers:', Object.fromEntries(response.headers.entries()));
			
			const text = await response.text();
			const yaml = yamlParse(text);
			const yamlError = this.validateYaml(yaml);
			if (yamlError) return yamlError;

			return new Response(text, {
				status: 200,
				headers: {
					...RESPONSE_HEADERS,
					'Subscription-Userinfo': response.headers.get('subscription-userinfo') || '',
					'Content-Disposition': `attachment; filename=${auth.config.FILE_NAME}`
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