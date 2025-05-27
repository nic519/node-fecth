import { TrafficUtils } from '@/utils/trafficUtils';
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
            TrafficUtils.fetchRemote(this.originalAirplaneUrl)
        ]);
        return {
            yamlContent: responseYaml,
            subInfo: responseSubInfo
        }
    }
}