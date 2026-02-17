/* eslint-disable @typescript-eslint/no-explicit-any */
import { parse as yamlParse } from 'yaml';

export class YamlValidator {
	public validateYaml(yaml: any): void {
		if (!yaml) {
			throw new Error('解析出的结果不是yaml格式');
		}
		if (!yaml.proxies || !Array.isArray(yaml.proxies)) {
			throw new Error('解析出的结果不符合clash的格式');
		}
	}

	public validate(content: string): void {
		try {
			const yaml = yamlParse(content);
			this.validateYaml(yaml);
		} catch (error) {
			console.error('Validation error:', error);
			throw error;
		}
	}
}
