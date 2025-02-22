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

// 环境变量接口
export interface Env {
	ENGINE_URL: string;    // 订阅转换引擎链接
	SUB_URL: string;       // 订阅链接
	RULE_URL: string;      // 规则链接
	ACCESS_TOKEN: string;  // 访问令牌
}

// 响应头配置
const RESPONSE_HEADERS = {
	'Content-Type': 'text/yaml; charset=utf-8',
	'Profile-Update-Interval': '24',
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'X-XSS-Protection': '1; mode=block'
};

// 订阅参数配置
const SUB_PARAMS = {
	target: 'clash',
	filename: 'BigMeGroup',
	options: {
		emoji: true,
		list: false,
		xudp: false,
		udp: false,
		tfo: false,
		expand: true,
		scv: false,
		fdn: false,
		new_name: true
	}
};

class SubscriptionService {
	constructor(private env: Env) {}

	// 验证访问令牌
	private validateToken(request: Request): Response | null {
		const url = new URL(request.url);
		const token = url.searchParams.get('token');
		
		if (!token || token !== this.env.ACCESS_TOKEN) {
			return new Response('Unauthorized', { status: 401 });
		}
		return null;
	}

	// 构建订阅URL
	private buildSubscriptionUrl(): string {
		const engineUrl = new URL(this.env.ENGINE_URL);
		const params = new URLSearchParams({
			target: SUB_PARAMS.target,
			url: this.env.SUB_URL,
			config: this.env.RULE_URL,
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
		// 验证令牌
		const tokenError = this.validateToken(request);
		if (tokenError) return tokenError;

		try {
			// 获取并转换订阅内容
			const finalURL = this.buildSubscriptionUrl();
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