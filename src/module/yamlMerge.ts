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

    // 从原始地址获取clash的剩余流量信息
    private async getSubInfo(subUrl: string): Promise<string> {
        // 并发执行两个fetch请求
        const responseClash = await fetch(subUrl, {
            headers: {
            'User-Agent': 'clash 1.10.0'
            }
        });
        const subInfo = responseClash.headers.get('subscription-userinfo') || ''; 
        return subInfo;
    }

    /// 把订阅地址合并进去
    async getYamlContent(yaml_url: string, airplane_url: string): Promise<string> {
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

    async merge(yaml_url: string, airplane_url: string): Promise<{yamlContent: string, subInfo: string}> {
        const [responseYaml, responseSubInfo] = await Promise.all([
            this.getYamlContent(yaml_url, airplane_url),
            this.getSubInfo(airplane_url)
        ]);
        return {
            yamlContent: responseYaml,
            subInfo: responseSubInfo
        }
    }
}