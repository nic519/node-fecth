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
	private buildSubscriptionUrl(userId: string, target: string = 'clash'): string {
		const userConfig = getUserConfig(this.env, userId);
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

	// 验证 YAML 格式（Clash）
	private validateYaml(yaml: any): Response | null {
		if (!yaml) {
			return new Response("解析出的结果不是yaml格式", { status: 500 });
		}
		if (!yaml.proxies || !Array.isArray(yaml.proxies) || yaml.proxies.length < 2) {
			return new Response("解析出的结果不符合clash的格式", { status: 500 });
		}
		return null;
	}

	// 验证 JSON 格式（sing-box）
	private validateJson(json: any): Response | null {
		if (!json) {
			return new Response("解析出的结果不是json格式", { status: 500 });
		}
		if (!json.outbounds || !Array.isArray(json.outbounds)) {
			return new Response("解析出的结果不符合sing-box的格式", { status: 500 });
		}
		return null;
	}

	// 处理订阅请求
	async handleRequest(request: Request): Promise<Response> {
		const auth = this.validateToken(request);
		if (auth instanceof Response) return auth;

		try {
			const url = new URL(request.url);
			const target = url.searchParams.get('target') || 'clash';
			
			const originUA = request.headers.get('User-Agent') || request.headers.get('user-agent') || 'clash 1.10.0';
			// console.log('originUA', originUA);

			const finalURL = this.buildSubscriptionUrl(auth.userId, target);
			const response = await fetch(finalURL, {
				headers: {
					'User-Agent': originUA,
					'Accept': 'text/yaml, application/json',
					'Accept-Encoding': 'gzip, deflate, br',
					'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
					'Cache-Control': 'no-cache',
				}
			});
			
			// 打印响应头，看看转换后的信息
			// console.log('Converted response headers:', Object.fromEntries(response.headers.entries()));
			
			const text = await response.text();
			
			// 根据 target 进行不同的格式验证
			let formatError = null;
			if (target === 'clash') {
				const yaml = yamlParse(text);
				formatError = this.validateYaml(yaml);
			} else if (target === 'singbox') {
				try {
					const json = JSON.parse(text);
					formatError = this.validateJson(json);
				} catch {
					formatError = new Response("无效的JSON格式", { status: 500 });
				}
			}
			
			if (formatError) return formatError;

			// 获取订阅信息
			const subInfo = response.headers.get('subscription-userinfo') || 
			response.headers.get('Subscription-Userinfo') ||
			response.headers.get('SUBSCRIPTION-USERINFO');

			// console.log('Sub info:', subInfo);  // 调试日志

			return new Response(text, {
				status: 200,
				headers: {
					...RESPONSE_HEADERS,
					'Content-Type': target === 'clash' ? 'text/yaml; charset=utf-8' : 'application/json; charset=utf-8',
					'Subscription-Userinfo': subInfo || '',  // 确保订阅信息被传递
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