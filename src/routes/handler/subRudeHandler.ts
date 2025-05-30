import { RouteHandler } from '@/routes/routesType';
import { RESPONSE_HEADERS, DBUser } from '@/types/types';
import { ConfigValidator } from '@/module/configValidator';
import { AuthUtils } from '@/utils/authUtils';
import { YamlRudeMerge } from '@/module/yamlRudeMerge';
import { CommonUtils } from '@/utils/commonUtils';

export class SubRudeHandler implements RouteHandler {
	private configValidator = new ConfigValidator();

	async handle(request: Request, env: Env, params?: Record<string, string>): Promise<Response | null> {
		const url = new URL(request.url);
		const uid = params?.uid;
		const token = url.searchParams.get('token');

		if (!uid || !token) {
			return new Response('缺少必要参数: uid, token', { status: 400 });
		}

		// 验证token
		const authConfig = AuthUtils.validateToken(uid, token, env);
		if (authConfig instanceof Response) return authConfig;

		try {
			const target = url.searchParams.get('target') || 'clash';
			const yamlMerge = new YamlRudeMerge(authConfig.subscribe, authConfig.ruleUrl);
			const { yamlContent, subInfo } = await yamlMerge.merge();

			// 使用配置验证器验证格式
			const formatError = this.configValidator.validate(yamlContent, target);
			if (formatError) return formatError;

			var headers = {
				...RESPONSE_HEADERS,
				'Subscription-Userinfo': subInfo,
				'Content-Type': target === 'clash' ? 'text/yaml; charset=utf-8' : 'application/json; charset=utf-8',
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
