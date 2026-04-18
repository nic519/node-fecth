/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClashProxyFilter } from '@/modules/yamlMerge/filters/clashProxyFilter';
import { ClashRuleFilter } from '@/modules/yamlMerge/filters/clashRuleFilter';
import { ClashRuleOverride } from '@/modules/yamlMerge/filters/clashRuleOverride';
import { YamlMergeFactory } from '@/modules/yamlMerge/yamlMergeFactory';
import { createLogService } from '@/services/log-service';
import { LogType } from '@/types/log';
import { UserConfig } from '@/types/openapi-schemas';
import { SubscribeParamsValidator } from '@/types/request/url-params.types';
import { RouteHandler } from '@/types/routes.types';
import { safeError } from '@/utils/logHelper';
import { CORS_HEADERS } from '@/utils/responseUtils';
import yaml from 'js-yaml';

const RESPONSE_HEADERS: Record<string, string> = {
	'Content-Type': 'text/yaml; charset=utf-8',
	'Profile-Update-Interval': '24',
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'X-XSS-Protection': '1; mode=block',
	...CORS_HEADERS,
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

	async handle(request: Request, env?: Env, params?: Record<string, any>): Promise<Response | null> {
		const url = new URL(request.url);
		const userConfig: UserConfig = params!.userConfig;
		const uid = params?.uid || url.searchParams.get('uid');
		const logger = createLogService(env);
		const startTime = Date.now();

		try {
			const queryParams = SubscribeParamsValidator.parseParams(url);

			const yamlMerge = new YamlMergeFactory(userConfig, { uid, env });
			// 获取合并后的 YAML 对象和性能计时数据
			const { yamlContent: yamlObj, subInfo, timings } = await yamlMerge.generate();

			// 处理用户干预（过滤、覆盖等），直接操作对象
			this._processUserIntervention(yamlObj, userConfig, request);

			// 将最终对象转储为 YAML 字符串
			let finalYamlString = yaml.dump(yamlObj);

			// 添加头部注释信息
			finalYamlString = await this._addRemark(finalYamlString, userConfig, uid, request, env);

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
		} catch (error: unknown) {
			console.error('ClashHandler handle error:', safeError(error));

			void logger.log({
				level: 'error',
				type: LogType.SUBSCRIPTION_ACCESS,
				message: '订阅生成失败',
				userId: uid,
				meta: {
					url: request.url,
					error: safeError(error),
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

	private async _addRemark(content: string, config: UserConfig, uid: string | undefined | null, request: Request, env?: Env): Promise<string> {
		let remark = '';
		
		if (uid && config.accessToken) {
			try {
				const urlObj = new URL(request.url);
				const configUrl = `${urlObj.origin}/config?uid=${uid}&token=${config.accessToken}`;
				remark += `# 订阅管理地址\n# ${configUrl}\n\n`;
			} catch {
			}
		}

		if (uid && env) {
			try {
				const logger = createLogService(env);
				// 查询最近的错误或警告日志 (最近 10 分钟)
				const startTime = new Date(Date.now() - 10 * 60 * 1000);
				const logs = await logger.queryLogs({
					userId: uid,
					limit: 10,
					startTime,
					level: 'warn' // 获取 warn 及以上级别，但目前 LogService 似乎只支持精确匹配，这里先只查 warn，或者我们修改 LogService 支持数组
				});

				// 由于 LogService.queryLogs 目前只支持单个 level，我们分别查询 error 和 warn
				// 或者我们修改 queryLogs 方法。为了最小化改动，这里简单查询一下最近的 error 和 warn
				
				const errorLogs = await logger.queryLogs({
					userId: uid,
					limit: 5,
					startTime,
					level: 'error'
				});
				
				const warnLogs = await logger.queryLogs({
					userId: uid,
					limit: 5,
					startTime,
					level: 'warn'
				});

				const allLogs = [...errorLogs.data, ...warnLogs.data].sort((a, b) => 
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);

				if (allLogs.length > 0) {
					remark += `# 最近的异常日志 (Last 10 min):\n`;
					for (const log of allLogs) {
						const time = new Date(log.createdAt).toLocaleTimeString();
						let msg = log.message;
						if (log.meta && typeof log.meta === 'object') {
							const meta = log.meta as Record<string, unknown>;
							if (meta.url) msg += ` URL: ${meta.url}`;
							if (meta.error) msg += ` Error: ${meta.error}`;
						}
						remark += `# [${time}] [${log.level.toUpperCase()}] ${msg}\n`;
					}
					remark += `\n`;
				}

			} catch (e) {
				console.error('Failed to add log remarks:', e);
			}
		}

		return remark + content;
	}
}
