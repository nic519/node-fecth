import { GlobalConfig } from '@/config/global-config';
import { TemplateManager } from '@/module/templateManager/templateManager';
import { InnerUser } from '@/module/userManager/innerUserConfig';
import { PreMergeInfo } from '@/module/yamlMerge/clash-merge.types';
import { StrategyDirectly } from '@/module/yamlMerge/strategyDirectly';
import { StrategyMultiPort } from '@/module/yamlMerge/strategyMultiPort';
import { TrafficUtils } from '@/utils/trafficUtils';
import { StrategyMultiSub } from './strategyMultiSub';

export class YamlMergeFactory {
	constructor(private userConfig: InnerUser) {}

	// 公共方法：1.获取模板内容，2.获取clash订阅配置
	async fetchPreMergeInfo(): Promise<PreMergeInfo> {
		let ruleContent: string;
		// 1. 获取模板内容
		// 智能判断：检测URL域名是否与worker域名相同，避免循环访问
		if (this.shouldUseInternalTemplate(this.userConfig.ruleUrl)) {
			// 如果是同域名，从本地KV获取模板内容
			const templateId = this.extractTemplateIdFromUrl(this.userConfig.ruleUrl);
			console.log(`🔄 检测到同域名访问，自动切换到内部KV获取模板: ${templateId}`);
			ruleContent = await this.getTemplateFromKV(templateId);
		} else if (this.userConfig.ruleUrl.startsWith('http')) {
			// 如果是外部URL，使用fetch获取内容
			console.log(`📡 从外部URL获取规则内容: ${this.userConfig.ruleUrl}`);
			ruleContent = await TrafficUtils.fetchRawContent(this.userConfig.ruleUrl);
		} else {
			// 如果是模板ID，从本地KV获取
			console.log(`🔑 从本地KV获取模板内容: ${this.userConfig.ruleUrl}`);
			ruleContent = await this.getTemplateFromKV(this.userConfig.ruleUrl);
		}

		// 2. 获取远端的代理信息
		const trafficUtils = new TrafficUtils(this.userConfig.subscribe);
		const { subInfo, content: clashContent } = await trafficUtils.fetchClashContent();
		return { ruleContent, clashContent, subInfo };
	}

	// 从本地KV获取模板内容
	private async getTemplateFromKV(templateId: string): Promise<string> {
		try {
			const env = GlobalConfig.env;
			if (!env) {
				throw new Error('环境变量未初始化');
			}

			const templateManager = new TemplateManager(env);
			const template = await templateManager.getTemplateById(templateId);

			if (!template) {
				throw new Error(`模板 ${templateId} 不存在`);
			}

			console.log(`✅ 成功从KV获取模板 ${templateId}, 名称: ${template.name}`);
			return template.content;
		} catch (error) {
			console.error(`❌ 从KV获取模板失败:`, error);
			throw new Error(`无法获取模板 ${templateId}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	// 检测是否应该使用内部模板（避免循环访问）
	private shouldUseInternalTemplate(urlOrId: string): boolean {
		if (!urlOrId.startsWith('http')) {
			return false; // 非URL格式，不使用此逻辑
		}

		if (GlobalConfig.isDev) {
			return false;
		}

		try {
			const url = new URL(urlOrId);
			const workerUrl = new URL(GlobalConfig.workerUrl);

			// 检测域名是否相同
			const isSameDomain = url.hostname === workerUrl.hostname;

			// 检测是否是模板API路径
			const isTemplatePath = url.pathname.includes('/api/subscription/template/');

			console.log(`🔍 域名检测: URL=${url.hostname}, Worker=${workerUrl.hostname}, 相同=${isSameDomain}, 模板路径=${isTemplatePath}`);

			return isSameDomain && isTemplatePath;
		} catch (error) {
			console.error(`❌ URL解析失败:`, error);
			return false;
		}
	}

	// 从URL中提取模板ID
	private extractTemplateIdFromUrl(url: string): string {
		try {
			const urlObj = new URL(url);
			const pathname = urlObj.pathname;

			// 匹配 /api/subscription/template/{templateId} 格式
			const match = pathname.match(/\/api\/subscription\/template\/(.+)$/);
			if (match && match[1]) {
				return match[1];
			}

			// 如果没有匹配到，尝试从查询参数中获取
			const templateId = urlObj.searchParams.get('template');
			if (templateId) {
				return templateId;
			}

			throw new Error(`无法从URL中提取模板ID: ${url}`);
		} catch (error) {
			console.error(`❌ 提取模板ID失败:`, error);
			throw new Error(`无法从URL中提取模板ID: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	// 直接合并，不把节点拉回来
	async fastStrategy(): Promise<{ yamlContent: string; subInfo: string }> {
		const baseInfo = await this.fetchPreMergeInfo();
		const yamlStrategy = new StrategyDirectly(baseInfo.ruleContent);
		return {
			yamlContent: yamlStrategy.generate(this.userConfig.subscribe),
			subInfo: baseInfo.subInfo,
		};
	}

	// 多端口模式，把节点拉回来
	async multiPortStrategy(): Promise<{ yamlContent: string; subInfo: string }> {
		const baseInfo = await this.fetchPreMergeInfo();
		const yamlStrategy = new StrategyMultiPort(baseInfo, this.userConfig);
		return {
			yamlContent: yamlStrategy.generate(),
			subInfo: baseInfo.subInfo,
		};
	}

	// 多订阅模式
	async multiSubStrategy(): Promise<{ yamlContent: string; subInfo: string }> {
		const baseInfo = await this.fetchPreMergeInfo();

		const yamlStrategy = new StrategyMultiSub(baseInfo, this.userConfig);
		return {
			yamlContent: await yamlStrategy.generate(),
			subInfo: baseInfo.subInfo,
		};
	}

	// 生成yaml内容
	async generate(): Promise<{ yamlContent: string; subInfo: string }> {
		console.log('🏭 YamlMergeFactory: 开始生成YAML内容');

		try {
			let result: { yamlContent: string; subInfo: string };

			if (this.userConfig.appendSubList) {
				console.log('📋 使用多订阅策略');
				result = await this.multiSubStrategy();
			} else if (this.userConfig.multiPortMode) {
				console.log('🔀 使用多端口策略');
				result = await this.multiPortStrategy();
			} else {
				console.log('⚡ 使用快速策略');
				result = await this.fastStrategy();
			}

			console.log(`✅ YAML生成完成，内容长度: ${result.yamlContent.length}`);
			return result;
		} catch (error) {
			console.error('❌ YAML生成失败:', error);
			throw error;
		}
	}
}
