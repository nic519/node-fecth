/* eslint-disable @typescript-eslint/no-explicit-any */
import yaml from 'js-yaml';
import { UserConfig } from '@/types/openapi-schemas';
import { YamlValidator } from '@/modules/yamlMerge/utils/yamlValidator';
import { YamlMergeFactory } from '@/modules/yamlMerge/yamlMergeFactory';
import { SubscribeParamsValidator } from '@/types/request/url-params.types';
import { RouteHandler } from '@/types/routes.types';
import { ClashRuleFilter } from '@/modules/yamlMerge/utils/clashRuleFilter';
import { ClashRuleOverride } from '@/modules/yamlMerge/utils/clashRuleOverride';
import type { YamlObject } from '@/modules/yamlMerge/utils/yamlTypes';

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

		try {
			const queryParams = SubscribeParamsValidator.parseParams(url);

			const yamlMerge = new YamlMergeFactory(userConfig);
			const { yamlContent: initialYamlContent, subInfo } = await yamlMerge.generate();

			const yamlContent = this._processUserIntervention(initialYamlContent, userConfig, params?.uid || url.searchParams.get('uid'), request);

			const yamlValidator = new YamlValidator();
			yamlValidator.validate(yamlContent);

			return new Response(yamlContent, {
				status: 200,
				headers: this._buildRespHeaders(subInfo, queryParams.download ? userConfig.fileName : undefined),
			});
		} catch (error) {
			console.error('ClashHandler handle error:', error);
			return new Response(error instanceof Error ? error.message : '处理订阅时发生错误', { status: 500 });
		}
	}

	private _processUserIntervention(content: string, config: UserConfig, uid: string | undefined | null, request: Request): string {
		let yamlObj: YamlObject;
		try {
			const parsed = yaml.load(content);
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
				return content;
			}
			yamlObj = parsed as YamlObject;
		} catch (e) {
			console.error('Failed to parse YAML for intervention:', e);
			return content;
		}

		if (config.requiredFilters) {
			const { keptGroupNames, allNodeNames } = ClashRuleFilter.filterProxyGroups(yamlObj, config.requiredFilters);
			ClashRuleFilter.filterRules(yamlObj, keptGroupNames, allNodeNames);
		}

		if (config.ruleOverwrite) {
			ClashRuleOverride.applyRuleOverwrite(yamlObj, config.ruleOverwrite);
		}

		let newContent = yaml.dump(yamlObj);

		newContent = this._addRemark(newContent, config, uid, request);

		return newContent;
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
