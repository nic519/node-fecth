import { PreMergeInfo } from '@/modules/yamlMerge/clash-merge.types';
import { StrategyDirectly } from '@/modules/yamlMerge/strategyDirectly';
import { StrategyMultiPort } from '@/modules/yamlMerge/strategyMultiPort';
import type { YamlObject } from '@/modules/yamlMerge/utils/yamlTypes';
import { UserConfig } from '@/types/openapi-schemas';
import { fetchRawContent } from '@/utils/http/client';
import { DynamicService } from '@/modules/dynamic/dynamic.service';
import yaml from 'js-yaml';
import { StrategyMultiSub } from './strategyMultiSub';
import { DEFAULT_RULE_URL } from '@/config/constants';

export class YamlMergeFactory {
	private timings: Record<string, number> = {};

	constructor(
		private userConfig: UserConfig,
		private runtimeOptions: { uid?: string; env?: Env } = {},
	) { }

	private async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
		const start = Date.now();
		try {
			return await fn();
		} finally {
			this.timings[name] = Date.now() - start;
		}
	}

	private get effectiveRuleUrl(): string {
		return this.userConfig.ruleUrl || DEFAULT_RULE_URL;
	}

	async fetchPreMergeInfo(): Promise<PreMergeInfo> {
		const templatePromise = this.measure('fetch_rule_content', () => this.fetchRuleContent());

		const clashPromise = this.measure('fetch_clash_content', async () => {
			const result = await DynamicService.fetchAndSave(this.userConfig.subscribe);
			return { subInfo: result.traffic || '', content: result.content };
		});

		const [ruleContent, { subInfo, content: clashContent }] = await Promise.all([templatePromise, clashPromise]);

		return { ruleContent, clashContent, subInfo };
	}

	private async fetchRuleContent(): Promise<string> {
		const ruleUrl = this.effectiveRuleUrl;

		return fetchRawContent(ruleUrl);
	}

	async fastStrategy(): Promise<{ yamlContent: YamlObject; subInfo: string }> {
		const baseInfo: PreMergeInfo = await this.fetchPreMergeInfo();
		const yamlStrategy = new StrategyDirectly(baseInfo);
		return {
			yamlContent: yamlStrategy.generate(),
			subInfo: baseInfo.subInfo,
		};
	}

	async multiPortStrategy(): Promise<{ yamlContent: YamlObject; subInfo: string }> {
		const baseInfo = await this.fetchPreMergeInfo();
		const yamlStrategy = new StrategyMultiPort(baseInfo, this.userConfig);
		return {
			yamlContent: yamlStrategy.generate(),
			subInfo: baseInfo.subInfo,
		};
	}

	async multiSubStrategy(): Promise<{ yamlContent: YamlObject; subInfo: string }> {
		const ruleContent = await this.measure('fetch_rule_content', () => this.fetchRuleContent());
		const yamlStrategy = new StrategyMultiSub(ruleContent, this.userConfig, this.runtimeOptions.uid);
		const { yamlContent, subInfo } = await yamlStrategy.generate();
		return { yamlContent, subInfo };
	}

	private applyOverride(content: YamlObject, override: string): YamlObject {
		if (!override || !override.trim()) return content;

		try {
			const loaded = yaml.load(override);
			if (!loaded || typeof loaded !== 'object' || Array.isArray(loaded)) {
				return content;
			}
			const overrideObj = loaded as YamlObject;
			const merged: YamlObject = { ...content, ...overrideObj };
			return merged;
		} catch (error) {
			console.error('applyOverride error:', error);
			return content;
		}
	}

	async generate(): Promise<{ yamlContent: YamlObject; subInfo: string; timings: Record<string, number> }> {
		try {
			let result: { yamlContent: YamlObject; subInfo: string };

			if (this.userConfig.appendSubList) {
				result = await this.measure('strategy_multi_sub', () => this.multiSubStrategy());
			} else if (this.userConfig.multiPortMode) {
				result = await this.measure('strategy_multi_port', () => this.multiPortStrategy());
			} else {
				result = await this.measure('strategy_fast', () => this.fastStrategy());
			}

			if (this.userConfig.ruleOverwrite) {
				result.yamlContent = this.applyOverride(result.yamlContent, this.userConfig.ruleOverwrite);
			}

			return {
				...result,
				timings: this.timings
			};
		} catch (error) {
			throw error;
		}
	}
}
