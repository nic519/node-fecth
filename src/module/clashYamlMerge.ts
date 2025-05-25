import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { ExtractClashNode } from './extractClashNode';
import { KvProxy } from '@/utils/kvProxy';  

export class ClashYamlMerge {
    private kvProxy: KvProxy;

    constructor(
        // 环境变量
        private env: Env, 
        // 请求
        private request: Request,
        // clash订阅地址
        private clashSubUrl: string,  
        // clash使用的yaml模板地址（仅包含规则）
        private clashTemplateUrl: string,
        // 用户信息
        private token: string,
        private uid: string
    ) {
        this.kvProxy = new KvProxy(env);
    }
    
    private getWorkerUrl(): string | null {
        const url = new URL(this.request.url);
        return url.origin;
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
    private async extractOriginalSubUrl(clashRawCfg: string): Promise<string> {
        const extractor = new ExtractClashNode();
        const clashNodes = extractor.getOriginalLinks(clashRawCfg);
        
        // 生成简单的键：使用URL的hostname和pathname的组合
        const url = new URL(this.clashSubUrl);
        const storageKey = `sub-${url.hostname}${url.pathname.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        // 使用KV代理服务进行存储
        // value要用base64编码
        const value = btoa(clashNodes);
        await this.kvProxy.put(storageKey, value); 
        // console.log(`🔑 提取原始订阅内容: ${clashNodes}`);
        
        return storageKey;
    }

    /// 把订阅地址合并进去
    async getFianlRawCfg(): Promise<{yamlContent: string, subInfo: string}> {
        // 得到clash配置+剩余流量信息
        const clashContent = await this.fetchClashContent();
        // 得到clash模板
        const clashCfgTemplate = await fetch(this.clashTemplateUrl).then(res => res.text());
        // 把clash配置里面的节点信息提取出来
        const kvKey = await this.extractOriginalSubUrl(clashContent.rawContent);
    

        const routeUrl = `${this.getWorkerUrl()}/kv?key=${kvKey}&uid=${this.uid}&token=${this.token}`;
        console.log(`🔑 提取原始订阅地址: ${routeUrl}`);

        // 合并yaml
        const yamlObj = yamlParse(clashCfgTemplate);
        // 修改proxy-providers中的url
        if (yamlObj['proxy-providers'] && yamlObj['proxy-providers']['Airport1']) {
            yamlObj['proxy-providers']['Airport1'].url = routeUrl;
        }
        // 把yamlObj转成yaml字符串
        return {
            yamlContent: yamlStringify(yamlObj),
            subInfo: clashContent.subInfo
        };
    }  

    async merge(): Promise<{yamlContent: string, subInfo: string}> {
        const {yamlContent, subInfo} = await this.getFianlRawCfg();
        return {
            yamlContent, 
            subInfo
        }
    }
} 