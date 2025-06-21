import { TrafficUtils } from '@/utils/trafficUtils';
import { StrategyDirectly } from '@/module/yamlMerge/strategyDirectly';
import { StrategyMultiPort } from '@/module/yamlMerge/strategyMultiPort';
import { StrategyMultiSub } from './strategyMultiSub';
import { InnerUser } from '@/module/userManager/innerUserConfig'; 
import { PreMergeInfo } from '@/module/yamlMerge/clash-merge.types';

export class YamlMergeFactory {
	constructor(private userConfig: InnerUser) {}

	// 公共方法：1.获取模板内容，2.获取clash订阅配置
	async fetchPreMergeInfo(): Promise<PreMergeInfo> { 
		const ruleContent = await TrafficUtils.fetchRawContent(this.userConfig.ruleUrl);
		const trafficUtils = new TrafficUtils(this.userConfig.subscribe);
		const { subInfo, content: clashContent } = await trafficUtils.fetchClashContent();
		return { ruleContent, clashContent, subInfo };
	}

	async fastStrategy(): Promise<{ yamlContent: string; subInfo: string }> {
		const baseInfo = await this.fetchPreMergeInfo();
		const yamlStrategy = new StrategyDirectly(baseInfo.ruleContent); 
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
		const baseInfo = await this.fetchPreMergeInfo();

		const yamlStrategy = new StrategyMultiSub(baseInfo, this.userConfig);
		return {
			yamlContent: await yamlStrategy.generate(),
			subInfo: baseInfo.subInfo,
		};
	}

	async generate(): Promise<{ yamlContent: string; subInfo: string }> {
		if (this.userConfig.appendSubList) {
			return await this.multiSubStrategy();
		} else if (this.userConfig.multiPortMode) {
			return await this.multiPortStrategy();
		}
		return await this.fastStrategy();
	}
}
