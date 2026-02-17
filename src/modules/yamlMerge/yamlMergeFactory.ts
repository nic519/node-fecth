import { GlobalConfig } from '@/config/global-config';
import { BaseCRUD } from '@/db/base-crud';
import { templates, type Template } from '@/db/schema';
import { UserConfig } from '@/types/openapi-schemas';
import { PreMergeInfo } from '@/modules/yamlMerge/clash-merge.types';
import { StrategyDirectly } from '@/modules/yamlMerge/strategyDirectly';
import { StrategyMultiPort } from '@/modules/yamlMerge/strategyMultiPort';
import { NetworkUtils } from '@/utils/request/network-utils';
import { ProxyFetch } from '@/utils/request/proxy-fetch';
import { StrategyMultiSub } from './strategyMultiSub';
import yaml from 'js-yaml';

export class YamlMergeFactory {
	constructor(private userConfig: UserConfig) { }

	private get effectiveRuleUrl(): string {
		return this.userConfig.ruleUrl || GlobalConfig.ruleUrl;
	}

	async fetchPreMergeInfo(): Promise<PreMergeInfo> {
		const templatePromise = this.fetchRuleContent();

		const trafficUtils = new ProxyFetch(this.userConfig.subscribe);
		const clashPromise = trafficUtils.fetchClashContent();

		const [ruleContent, { subInfo, content: clashContent }] = await Promise.all([templatePromise, clashPromise]);

		return { ruleContent, clashContent, subInfo };
	}

	private async fetchRuleContent(): Promise<string> {
		let ruleContent: string;
		const ruleUrl = this.effectiveRuleUrl;

		if (this.shouldUseInternalTemplate(ruleUrl)) {
			const templateId = this.extractTemplateIdFromUrl(ruleUrl);
			ruleContent = await this.getTemplateFromDB(templateId);
		} else if (ruleUrl.startsWith('http')) {
			ruleContent = await NetworkUtils.fetchRawContent(ruleUrl);
		} else {
			ruleContent = await this.getTemplateFromDB(ruleUrl);
		}

		return ruleContent;
	}

	private async getTemplateFromDB(templateId: string): Promise<string> {
		try {
			const env = GlobalConfig.env;
			if (!env) {
				throw new Error('环境变量未初始化');
			}

			const crud = new BaseCRUD<Template>(env, templates);
			const template = await crud.selectById(templateId);

			if (!template) {
				throw new Error(`模板 ${templateId} 不存在`);
			}

			return template.content || '';
		} catch (error) {
			throw new Error(`无法获取模板 ${templateId}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private shouldUseInternalTemplate(urlOrId: string): boolean {
		if (!urlOrId.startsWith('http')) {
			return false;
		}

		if (GlobalConfig.isDev) {
			return false;
		}

		try {
			const url = new URL(urlOrId);
			const workerUrl = new URL(GlobalConfig.workerUrl);

			const isSameDomain = url.hostname === workerUrl.hostname;
			const isTemplatePath = url.pathname.includes('/api/subscription/template/');

			return isSameDomain && isTemplatePath;
		} catch (error) {
			console.error('shouldUseInternalTemplate error:', error);
			return false;
		}
	}

	private extractTemplateIdFromUrl(url: string): string {
		try {
			const urlObj = new URL(url);
			const pathname = urlObj.pathname;

			const match = pathname.match(/\/api\/subscription\/template\/(.+)$/);
			if (match && match[1]) {
				return match[1];
			}

			const templateId = urlObj.searchParams.get('template');
			if (templateId) {
				return templateId;
			}

			throw new Error(`无法从URL中提取模板ID: ${url}`);
		} catch (error) {
			console.error('extractTemplateIdFromUrl error:', error);
			throw new Error(`无法从URL中提取模板ID: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	async fastStrategy(): Promise<{ yamlContent: string; subInfo: string }> {
		const baseInfo: PreMergeInfo = await this.fetchPreMergeInfo();
		const yamlStrategy = new StrategyDirectly(baseInfo);
		return {
			yamlContent: yamlStrategy.generate(this.userConfig.subscribe),
			subInfo: baseInfo.subInfo,
		};
	}

	async multiPortStrategy(): Promise<{ yamlContent: string; subInfo: string }> {
		const baseInfo = await this.fetchPreMergeInfo();
		const yamlStrategy = new StrategyMultiPort(baseInfo, this.userConfig);
		return {
			yamlContent: yamlStrategy.generate(),
			subInfo: baseInfo.subInfo,
		};
	}

	async multiSubStrategy(): Promise<{ yamlContent: string; subInfo: string }> {
		const ruleContent = await this.fetchRuleContent();
		const yamlStrategy = new StrategyMultiSub(ruleContent, this.userConfig);
		const { yamlContent, subInfo } = await yamlStrategy.generate();
		return { yamlContent, subInfo };
	}

	private applyOverride(content: string, override: string): string {
		if (!override || !override.trim()) return content;

		try {
			const baseObj = yaml.load(content) as Record<string, unknown>;
			const overrideObj = yaml.load(override) as Record<string, unknown>;

			const merged = { ...baseObj, ...overrideObj };

			return yaml.dump(merged);
		} catch (error) {
			console.error('applyOverride error:', error);
			return content;
		}
	}

	async generate(): Promise<{ yamlContent: string; subInfo: string }> {
		try {
			let result: { yamlContent: string; subInfo: string };

			if (this.userConfig.appendSubList) {
				result = await this.multiSubStrategy();
			} else if (this.userConfig.multiPortMode) {
				result = await this.multiPortStrategy();
			} else {
				result = await this.fastStrategy();
			}

			if (this.userConfig.ruleOverwrite) {
				result.yamlContent = this.applyOverride(result.yamlContent, this.userConfig.ruleOverwrite);
			}

			return result;
		} catch (error) {
			throw error;
		}
	}
}
