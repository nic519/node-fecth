import { parse as yamlParse } from 'yaml';

// 配置验证器类
export class ConfigValidator {
  // 验证 YAML 格式（Clash）
  public validateYaml(yaml: any): Response | null {
    if (!yaml) {
      return new Response("解析出的结果不是yaml格式", { status: 500 });
    }
    // console.log(yaml.proxies);
    if (!yaml.proxies || !Array.isArray(yaml.proxies) || yaml.proxies.length < 2) {
      return new Response("解析出的结果不符合clash的格式", { status: 500 });
    }
    return null;
  }

  // 验证 JSON 格式（sing-box）
  public validateJson(json: any): Response | null {
    if (!json) {
      return new Response("解析出的结果不是json格式", { status: 500 });
    }
    if (!json.outbounds || !Array.isArray(json.outbounds)) {
      return new Response("解析出的结果不符合sing-box的格式", { status: 500 });
    }
    return null;
  }

  // 根据目标类型验证配置
  public validate(content: string, target: string): Response | null {
    try {
      if (target === 'clash') {
        const yaml = yamlParse(content);
        return this.validateYaml(yaml);
      } else if (target === 'singbox') {
        const json = JSON.parse(content);
        return this.validateJson(json);
      }
      return null;
    } catch (error) {
      console.error('Validation error:', error);
      return new Response(`无效的${target}格式`, { status: 500 });
    }
  }
} 