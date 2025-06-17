import { TrafficUtils } from '@/utils/trafficUtils';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { YamlMergeStrategy, YamlMultiPortStrategy } from './yamlMergeStrategy';

export class YamlRudeMerge {
	constructor(
		// 机场原始订阅地址
		private clashSubUrl: string,
		// clash使用的yaml配置地址（仅包含规则）
		private ruleUrl: string
	) {}

	async fastStrategy(): Promise<{ yamlContent: string; subInfo: string }> {
		const ruleContent = await TrafficUtils.fetchRawContent(this.ruleUrl);
		const yamlStrategy = new YamlMergeStrategy(ruleContent);
		const { subInfo, content } = await TrafficUtils.fetchClashContent(this.clashSubUrl);
		return {
			yamlContent: yamlStrategy.generate(this.clashSubUrl),
			subInfo: subInfo,
		};
	}

	async multiPortStrategy(): Promise<{ yamlContent: string; subInfo: string }> {
		const ruleContent = await TrafficUtils.fetchRawContent(this.ruleUrl);
		const { subInfo, content: clashContent } = await TrafficUtils.fetchClashContent(this.clashSubUrl);
		const yamlStrategy = new YamlMultiPortStrategy(ruleContent, clashContent);
		return {
			yamlContent: yamlStrategy.generate(),
			subInfo: subInfo,
		};
	}
}
