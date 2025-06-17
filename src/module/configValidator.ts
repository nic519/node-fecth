import { parse as yamlParse } from 'yaml';

// 配置验证器类
export class ConfigValidator {
	// 验证 YAML 格式（Clash）
	public validateYaml(yaml: any): Response | null {
		if (!yaml) {
			return new Response('解析出的结果不是yaml格式', { status: 500 });
		}
		// console.log(yaml.proxies);
		if (!yaml.proxies || !Array.isArray(yaml.proxies)) {
			return new Response('解析出的结果不符合clash的格式', { status: 500 });
		}
		return null;
	}

	// 根据目标类型验证配置
	public validate(content: string): Response | null {
		try {
			const yaml = yamlParse(content);
			return this.validateYaml(yaml);
		} catch (error) {
			console.error('Validation error:', error);
			return new Response(`无效的格式`, { status: 500 });
		}
	}
}
