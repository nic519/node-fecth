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
		const ruleContent = await TrafficUtils.fetchRawContent(this.userConfig.ruleUrl);
		const trafficUtils = new TrafficUtils(this.userConfig.subscribe);
		const { subInfo, content: clashContent } = await trafficUtils.fetchClashContent();
		return { ruleContent, clashContent, subInfo };
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
