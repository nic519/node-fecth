import type { YamlObject } from '@/modules/yamlMerge/utils/yamlTypes';
import { UserConfig } from '@/types/openapi-schemas';
import { fetchRawContent } from '@/utils/http/client';
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

	private async fetchRuleContent(): Promise<string> {
		const ruleUrl = this.effectiveRuleUrl;

		return fetchRawContent(ruleUrl);
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
			const result = await this.measure('strategy_multi_sub', () => this.multiSubStrategy());

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
