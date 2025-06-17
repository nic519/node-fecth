import { parse as yamlParse, stringify as yamlStringify } from 'yaml';

export class StrategyDirectly {
	constructor(private ruleContent: string) {}

	generate(subUrl: string): string {
		const yamlObj = yamlParse(this.ruleContent);
		if (yamlObj['proxy-providers'] && yamlObj['proxy-providers']['Airport1']) {
			yamlObj['proxy-providers']['Airport1'].url = subUrl;
		}
		return yamlStringify(yamlObj);
	}
}
