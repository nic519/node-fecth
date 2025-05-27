import { parse as yamlParse, stringify as yamlStringify } from 'yaml';

export class YamlMerge {
    // 机场原始订阅地址 
    private originalAirplaneUrl: string;

    // clash使用的yaml配置地址（仅包含规则）
    private yamlCfgUrl: string;

    constructor(airplaneUrl: string, yamlCfgUrl: string) {
        this.originalAirplaneUrl = airplaneUrl;
        this.yamlCfgUrl = yamlCfgUrl;
    }
    
    /// 读取远程内容
    private async fetchRemoteContent(url: string): Promise<any> {
        const response = await fetch(url);
        return response.text();
    } 

    // 从原始地址获取clash的剩余流量信息
    private async fetchSubInfo(commonAirplaneUrl: string): Promise<string> {
        // 并发执行两个fetch请求
        const responseClash = await fetch(commonAirplaneUrl, {
            headers: {
            'User-Agent': 'clash 1.10.0'
            }
        });
        const subInfo = responseClash.headers.get('subscription-userinfo') || ''; 
        return subInfo;
    }

    /// 把订阅地址合并进去
    async getFianlRawCfg(yamlUrl: string, airplaneRawUrl: string): Promise<string> {
        const yamlContent = await this.fetchRemoteContent(yamlUrl);
        
        // 合并yaml
        const yamlObj = yamlParse(yamlContent);
        // 修改proxy-providers中的url
        if (yamlObj['proxy-providers'] && yamlObj['proxy-providers']['Airport1']) {
            yamlObj['proxy-providers']['Airport1'].url = airplaneRawUrl;
        }
        // 把yamlObj转成yaml字符串
        return yamlStringify(yamlObj);
    }  

    async merge(): Promise<{yamlContent: string, subInfo: string}> {
        const [responseYaml, responseSubInfo] = await Promise.all([
            this.getFianlRawCfg(this.yamlCfgUrl, this.originalAirplaneUrl),
            this.fetchSubInfo(this.originalAirplaneUrl)
        ]);
        return {
            yamlContent: responseYaml,
            subInfo: responseSubInfo
        }
    }
}