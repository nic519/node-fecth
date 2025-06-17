import { TrafficUtils } from '@/utils/trafficUtils';
import { StrategyDirectly } from '@/module/yamlMerge/strategyDirectly';
import { StrategyMultiPort } from '@/module/yamlMerge/strategyMultiPort';
import { DBUser } from '@/types/userTypes';

export class YamlMergeFactory {
	constructor(private userConfig: DBUser) {}

	async fastStrategy(): Promise<{ yamlContent: string; subInfo: string }> {
		const ruleContent = await TrafficUtils.fetchRawContent(this.userConfig.ruleUrl);
		const yamlStrategy = new StrategyDirectly(ruleContent);
		const { subInfo, content } = await TrafficUtils.fetchClashContent(this.userConfig.subscribe);
		return {
			yamlContent: yamlStrategy.generate(this.userConfig.subscribe),
			subInfo: subInfo,
		};
	}

	async multiPortStrategy(): Promise<{ yamlContent: string; subInfo: string }> {
		const ruleContent = await TrafficUtils.fetchRawContent(this.userConfig.ruleUrl);
		const { subInfo, content: clashContent } = await TrafficUtils.fetchClashContent(this.userConfig.subscribe);
		const yamlStrategy = new StrategyMultiPort(ruleContent, clashContent);
		return {
			yamlContent: yamlStrategy.generate(),
			subInfo: subInfo,
		};
	}
}
