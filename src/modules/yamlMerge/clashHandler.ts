/* eslint-disable @typescript-eslint/no-explicit-any */
import yaml from 'js-yaml';
import { UserConfig } from '@/types/openapi-schemas';
import { YamlValidator } from '@/modules/yamlMerge/utils/yamlValidator';
import { YamlMergeFactory } from '@/modules/yamlMerge/yamlMergeFactory';
import { SubscribeParamsValidator } from '@/types/request/url-params.types';
import { RouteHandler } from '@/types/routes.types';
import { ClashRuleFilter } from '@/modules/yamlMerge/utils/clashRuleFilter';
import { ClashRuleOverride } from '@/modules/yamlMerge/utils/clashRuleOverride';
import { ClashProxyFilter } from '@/modules/yamlMerge/utils/clashProxyFilter';
import { createLogService } from '@/services/log-service';
import { LogType } from '@/types/log';
import { ResponseUtils } from '@/utils/responseUtils';

const RESPONSE_HEADERS: Record<string, string> = {
	'Content-Type': 'text/yaml; charset=utf-8',
	'Profile-Update-Interval': '24',
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'X-XSS-Protection': '1; mode=block',
};

export class ClashHandler implements RouteHandler {
	private _buildRespHeaders(subInfo: string, fileName?: string): Record<string, string> {
		const headers: Record<string, string> = {
			...RESPONSE_HEADERS,
			'Subscription-Userinfo': subInfo,
		};
		if (fileName) {
			headers['Content-Disposition'] = `attachment; filename=${fileName}.yaml`;
		}
		return headers;
	}

	async handle(request: Request, env: Env, params?: Record<string, any>): Promise<Response | null> {
		const url = new URL(request.url);
		const userConfig: UserConfig = params!.userConfig;
		const uid = params?.uid || url.searchParams.get('uid');
		const logger = createLogService(env);
		const startTime = Date.now();

		try {
			const queryParams = SubscribeParamsValidator.parseParams(url);

			const yamlMerge = new YamlMergeFactory(userConfig);
			// 获取合并后的 YAML 对象和性能计时数据
			const { yamlContent: yamlObj, subInfo, timings } = await yamlMerge.generate();

			// 处理用户干预（过滤、覆盖等），直接操作对象
			this._processUserIntervention(yamlObj, userConfig, request);

			// 验证对象结构（可选，视 YamlValidator 实现而定，这里假设校验字符串更稳妥，或者跳过对象校验）
			// const yamlValidator = new YamlValidator();
			// yamlValidator.validateYaml(yamlObj);

			// 将最终对象转储为 YAML 字符串
			let finalYamlString = yaml.dump(yamlObj);

			// 添加头部注释信息
			finalYamlString = this._addRemark(finalYamlString, userConfig, uid, request);

			const totalDuration = Date.now() - startTime;

			// 记录详细的性能日志
			void logger.log({
				level: 'info',
				type: LogType.SUBSCRIPTION_ACCESS,
				message: '订阅生成成功',
				userId: uid,
				meta: {
					url: request.url,
					timings: {
						...timings,
						total: totalDuration
					},
					subInfo,
					contentLength: finalYamlString.length
				}
			});

			return new Response(finalYamlString, {
				status: 200,
				headers: this._buildRespHeaders(subInfo, queryParams.download ? userConfig.fileName : undefined),
			});
		} catch (error) {
			console.error('ClashHandler handle error:', error);

			void logger.log({
				level: 'error',
				type: LogType.SUBSCRIPTION_ACCESS,
				message: '订阅生成失败',
				userId: uid,
				meta: {
					url: request.url,
					error: error instanceof Error ? error.message : String(error),
					timings: {
						total: Date.now() - startTime
					}
				}
			});

			return new Response(error instanceof Error ? error.message : '处理订阅时发生错误', { status: 500 });
		}
	}

	/**
	 * 处理用户干预逻辑（过滤、覆盖等）
	 * 直接修改传入的 yamlObj 对象
	 */
	private _processUserIntervention(yamlObj: Record<string, any>, config: UserConfig, request: Request): void {
		if (typeof yamlObj !== 'object' || yamlObj === null) {
			return;
		}

		// 1. 应用规则过滤器
		if (config.requiredFilters) {
			const { keptGroupNames, allNodeNames } = ClashRuleFilter.filterProxyGroups(yamlObj, config.requiredFilters);
			ClashRuleFilter.filterRules(yamlObj, keptGroupNames, allNodeNames);
		}

		// 2. 应用规则覆盖
		if (config.ruleOverwrite) {
			ClashRuleOverride.applyRuleOverwrite(yamlObj, config.ruleOverwrite);
		}

		// 3. 应用正则排除
		if (config.excludeRegex) {
			ClashProxyFilter.filterByRegex(yamlObj, config.excludeRegex);
		}

		// 4. 检查 User-Agent 是否包含 stash，如果是则过滤掉 anytls 类型的节点
		const userAgent = request.headers.get('User-Agent');
		if (userAgent && /stash/i.test(userAgent)) {
			ClashProxyFilter.filterByType(yamlObj, 'anytls');
		}
	}

	private _addRemark(content: string, config: UserConfig, uid: string | undefined | null, request: Request): string {
		if (uid && config.accessToken) {
			try {
				const urlObj = new URL(request.url);
				const configUrl = `${urlObj.origin}/config?uid=${uid}&token=${config.accessToken}`;
				return `# 订阅管理地址\n# ${configUrl}\n\n` + content;
			} catch {
			}
		}
		return content;
	}
}
