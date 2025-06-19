import { RouteHandler } from '@/types/routes.types';
import { YamlValidator } from '@/module/yamlMerge/utils/yamlValidator';
import { YamlMergeFactory } from '@/module/yamlMerge/yamlMergeFactory';
import { SubscribeParamsValidator } from '@/types/url-params.types';

// 响应头配置
const RESPONSE_HEADERS = {
	// 指定响应内容的类型为YAML，使用UTF-8编码
	'Content-Type': 'text/yaml; charset=utf-8',

	// 指定Clash配置文件的自动更新间隔（小时）
	'Profile-Update-Interval': '24',

	// 防止浏览器嗅探响应内容类型，增强安全性
	'X-Content-Type-Options': 'nosniff',

	// 防止网页被嵌入到iframe中，防止点击劫持攻击
	'X-Frame-Options': 'DENY',

	// 启用浏览器XSS过滤器，并在检测到攻击时阻止页面加载
	'X-XSS-Protection': '1; mode=block',
};

export class ClashHandler implements RouteHandler {
	private yamlValidator = new YamlValidator();

	async handle(request: Request, env: Env, params?: Record<string, any>): Promise<Response | null> {
		const url = new URL(request.url);
		const authConfig = params?.authConfig;
		if (!authConfig) {
			return new Response('缺少必要参数: authConfig', { status: 400 });
		}

		try {
			const queryParams = SubscribeParamsValidator.parseParams(url);
			const yamlMerge = new YamlMergeFactory(authConfig);
			const { yamlContent, subInfo } = await yamlMerge.generate();

			// 使用配置验证器验证格式
			this.yamlValidator.validate(yamlContent);

			var headers = {
				...RESPONSE_HEADERS,
				'Subscription-Userinfo': subInfo,
				'Content-Type': 'text/yaml; charset=utf-8',
			};

			// 通过URL参数控制是否下载文件
			if (queryParams.download) {
				(headers as any)['Content-Disposition'] = `attachment; filename=${authConfig.fileName}.yaml`;
			}

			return new Response(yamlContent, {
				status: 200,
				headers: headers,
			});
		} catch (error) {
			console.error('Error:', error);
			return new Response(error instanceof Error ? error.message : '处理订阅时发生错误', { status: 500 });
		}
	}
}
