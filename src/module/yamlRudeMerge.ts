import { TrafficUtils } from '@/utils/trafficUtils';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';

export class YamlRudeMerge {
  
    constructor(
        // 机场原始订阅地址 
        private clashSubUrl: string,
        // clash使用的yaml配置地址（仅包含规则）
        private yamlCfgUrl: string) {
    }
    
    /// 读取远程内容
    private async fetchRemoteContent(url: string): Promise<any> {
        const response = await fetch(url);
        return response.text();
    }

    /// 把订阅地址合并进去
    async getFianlRawCfg(): Promise<string> {
        const yamlContent = await this.fetchRemoteContent(this.yamlCfgUrl);
        
        // 合并yaml
        const yamlObj = yamlParse(yamlContent);
        // 修改proxy-providers中的url
        if (yamlObj['proxy-providers'] && yamlObj['proxy-providers']['Airport1']) {
            yamlObj['proxy-providers']['Airport1'].url = this.clashSubUrl;
        }
        // 把yamlObj转成yaml字符串
        return yamlStringify(yamlObj);
    }  

    async merge(): Promise<{yamlContent: string, subInfo: string}> {
        const responseYaml = await this.getFianlRawCfg();
        const subInfo = await TrafficUtils.fetchRemote(this.clashSubUrl);
        return {
            yamlContent: responseYaml, 
            subInfo: subInfo
        }
    }
}