import { parse as yamlParse } from 'yaml';

// 配置验证器类
export class YamlValidator {
	// 验证 YAML 格式（Clash）
	public validateYaml(yaml: any): void {
		if (!yaml) {
			throw new Error('解析出的结果不是yaml格式');
		}
		// console.log(yaml.proxies);
		if (!yaml.proxies || !Array.isArray(yaml.proxies)) {
			throw new Error('解析出的结果不符合clash的格式');
		}
	}

	// 根据目标类型验证配置
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
