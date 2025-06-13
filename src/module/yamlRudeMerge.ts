import { TrafficUtils } from '@/utils/trafficUtils';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { YamlMergeStrategy } from './yamlMergeStrategy';

export class YamlRudeMerge {
	constructor(
		// 机场原始订阅地址
		private clashSubUrl: string,
		// clash使用的yaml配置地址（仅包含规则）
		private ruleUrl: string
	) {}

	/// 把订阅地址合并进去
	async mergeProvider(): Promise<string> {
		const yamlContent = await TrafficUtils.fetchRawContent(this.ruleUrl);
		const yamlStrategy = new YamlMergeStrategy(yamlContent);
		return yamlStrategy.generate(this.clashSubUrl);
	}

	async merge(): Promise<{ yamlContent: string; subInfo: string }> {
		const responseYaml = await this.mergeProvider();
		const { subInfo, content } = await TrafficUtils.fetchClashContent(this.clashSubUrl);
		return {
			yamlContent: responseYaml,
			subInfo: subInfo,
		};
	}
}
