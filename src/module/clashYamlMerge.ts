import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { ExtractClashNode, OutputFormat } from './extractClashNode';

export class YamlMerge {

    constructor(
        private env: Env, 
        // clash订阅地址
        private clashSubUrl: string,  
        // clash使用的yaml模板地址（仅包含规则）
        private clashTemplateUrl: string 
    ) {
       
    }

    // 从原始地址获取clash的剩余流量信息
    private async fetchClashContent(): Promise<{subInfo: string, rawContent: string}> {
        const responseClash = await fetch(this.clashSubUrl, {
            headers: {
            'User-Agent': 'clash 1.10.0'
            }
        });
        const subInfo = responseClash.headers.get('subscription-userinfo') || ''; 
        const rawContent = await responseClash.text();
        return {
            subInfo,
            rawContent
        };
    }

    // 根据clash的yaml动态配置，提取原始订阅地址
    // 把原始订阅地址，存入worker的kv，并可以通过一个url获取出来
    private extractOriginalSubUrl(clashRawCfg: string): string {
        const extractor = new ExtractClashNode();
        const clashNodes = extractor.getOriginalLinks(clashRawCfg);
        // 把原始订阅地址，存入worker的kv，并可以通过一个url获取出来
        const storageKey = `sub-${this.clashSubUrl}`;
        this.env.KV_BINDING.put(storageKey, clashNodes);
        return storageKey;
    }

    /// 把订阅地址合并进去
    async getFianlRawCfg(airplaneRawUrl: string): Promise<string> {
        // 得到clash配置+剩余流量信息
        const clashContent = await this.fetchClashContent();
        // 得到clash模板
        const clashCfgTemplate = await fetch(this.clashTemplateUrl).then(res => res.text());
        // 把clash配置里面的节点信息提取出来
        const kvKey = this.extractOriginalSubUrl(clashContent.rawContent);
        // 合并yaml
        const yamlObj = yamlParse(clashCfgTemplate);
        // 修改proxy-providers中的url
        if (yamlObj['proxy-providers'] && yamlObj['proxy-providers']['Airport1']) {
            yamlObj['proxy-providers']['Airport1'].url = airplaneRawUrl;
        }
        // 把yamlObj转成yaml字符串
        return yamlStringify(yamlObj);
    }  

    async merge(): Promise<{yamlContent: string, subInfo: string}> {
        const [responseYaml, responseSubInfo] = await Promise.all([
            this.getFianlRawCfg(this.clashTemplateUrl, this.clashSubUrl)
        ]);
        return {
            yamlContent: responseYaml, 
        }
    }
} 