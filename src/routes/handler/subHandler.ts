import { RouteHandler } from '@/types/routesType';
import { RESPONSE_HEADERS, ProcessedDBUser } from '@/types/userTypes';
import { ConfigValidator } from '@/module/configValidator';
import { YamlMerge } from '@/module/yamlCommonMerge';
import { AuthUtils } from '@/utils/authUtils';
import { CommonUtils } from '@/utils/commonUtils';

export class SubscriptionHandler implements RouteHandler {
	private configValidator = new ConfigValidator();

	async handle(request: Request, env: Env, params?: Record<string, string>): Promise<Response | null> {
		const url = new URL(request.url);
		const uid = params?.uid || url.pathname.slice(1);
		const token = url.searchParams.get('token');

		// 验证token
		const authConfig = AuthUtils.validateToken(uid, token, env);
		if (authConfig instanceof Response) return authConfig;

		try {
			const target = url.searchParams.get('target') || 'clash';
			const yamlMerge = new YamlMerge(authConfig.subscribe, authConfig.ruleUrl);
			const { yamlContent, subInfo } = await yamlMerge.merge();

			// 使用配置验证器验证格式
			const formatError = this.configValidator.validate(yamlContent, target);
			if (formatError) return formatError;

			var headers = {
				...RESPONSE_HEADERS,
				'Content-Type': target === 'clash' ? 'text/yaml; charset=utf-8' : 'application/json; charset=utf-8',
				'Subscription-Userinfo': subInfo,
			};

			// 通过URL参数控制是否下载文件
			if (!CommonUtils.isLocalEnv(request)) {
				(headers as any)['Content-Disposition'] = `attachment; filename=${authConfig.fileName}.${target === 'clash' ? 'yaml' : 'json'}`;
			}

			return new Response(yamlContent, {
				status: 200,
				headers: headers,
			});
		} catch (error) {
			console.error('Error:', error);
			return new Response('处理订阅时发生错误', { status: 500 });
		}
	}
}
