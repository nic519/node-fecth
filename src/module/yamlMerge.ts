import { parse as yamlParse, stringify as yamlStringify } from 'yaml';

export class YamlMerge {
    private yaml: any;

    constructor(yaml: any) {
        this.yaml = yaml;
    }
    
    /// 下载远程yaml
    private async downloadRemoteYaml(url: string): Promise<any> {
        const response = await fetch(url);
        return response.text();
    }

    /// 把订阅地址合并进去
    async mergeSubscription(yaml_url: string, airplane_url: string): Promise<string> {
        const yamlContent = await this.downloadRemoteYaml(yaml_url);
        
        // 合并yaml
        const yamlObj = yamlParse(yamlContent);
        // 修改proxy-providers中的url
        if (yamlObj['proxy-providers'] && yamlObj['proxy-providers']['Airport1']) {
            yamlObj['proxy-providers']['Airport1'].url = airplane_url;
        }
        // 把yamlObj转成yaml字符串
        return yamlStringify(yamlObj);
    }

}