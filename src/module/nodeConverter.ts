// 节点转换器类
import { parse as yamlParse } from 'yaml';

export class NodeConverter {
  // Base64 编码（支持 UTF-8）
  private utf8ToBase64(str: string): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const binString = Array.from(bytes).map(x => String.fromCharCode(x)).join('');
    return btoa(binString);
  }

  // 生成假节点
  private generateFakeNodes(realNodes: string[]): string[] {
    const randomString = Math.random().toString(36).substring(2, 9);
    const randomUrl = `${randomString}.com`;

    return realNodes.map(node => {
      const subDomain = Math.random().toString(36).substring(2, 7);
      // 使用正则提取域名和端口
      const realDomain = this.extractDomain(node);
      if (!realDomain) return node;  // 如果没有匹配到域名，返回原始节点
      const fakeDomain = `${subDomain}.${randomUrl}`;
      // console.log(`fakeNode: ${node.replace(realDomain, fakeDomain)}`);
      return node.replace(realDomain, fakeDomain);
    });
  }

  private extractDomain(node: string): string {
    const domain = node.match(/(?<=@).*?(?=:)/)?.[0];
    if (!domain) return node;  // 如果没有匹配到域名，返回原始节点
    return domain;
  }

  // 获取真实节点
  private async getRealNodes(subUrl: string): Promise<{nodes: string[], subInfo: string }> {
    const response = await fetch(subUrl, {
      headers: {
        'User-Agent': 'clash 1.10.0'
      }
    });
    let text = await response.text();
    // 如果结果是base64编码，则先解码
    const yaml = yamlParse(text);

    const proxiesObj = yaml.proxies;

    // 把clash的yaml的proxies转换为常规的节点
    // 把 {name: 🇭🇰 香港00, server: 420mco4.icfjlk.xyz, port: 40269, client-fingerprint: chrome, type: trojan, password: a7a35cc7-4137-4b2f-a3e7-4bdb42876b2a, sni: i0.hdslb.com, skip-cert-verify: false} 
    // 转换为 trojan://1911e7c8-e50c-48c0-9708-4492a59706fa@420mco4.icfjlk.xyz:40269?allowInsecure=1&peer=i0.hdslb.com&sni=i0.hdslb.com#%F0%9F%87%AD%F0%9F%87%B0%20%E9%A6%99%E6%B8%AF00
    // 把  {name: 🇭🇰 香港01, server: o5gemqnew.bigmeyear.org, port: 51001, client-fingerprint: chrome, type: ss, cipher: aes-128-gcm, password: 1911e7c8-e50c-48c0-9708-4492a59706fa, tfo: false}
    // ss://YWVzLTEyOC1nY206MTkxMWU3YzgtZTUwYy00OGMwLTk3MDgtNDQ5MmE1OTcwNmZh@iq6dsbz.icfjlk.xyz:40662#%F0%9F%87%AD%F0%9F%87%B0%20%E9%A6%99%E6%B8%AF01
    const proxies = proxiesObj.map((proxy: any) => {
      if (proxy.type === 'trojan') {
        return `${proxy.type}://${proxy.password}@${proxy.server}:${proxy.port}?allowInsecure=1&peer=${proxy.sni}&sni=${proxy.sni}#${encodeURIComponent(proxy.name)}`;
      } else if (proxy.type === 'ss') {
        // 将 cipher:password 组合并进行 base64 编码
        const userinfo = this.utf8ToBase64(`${proxy.cipher}:${proxy.password}`);
        return `ss://${userinfo}@${proxy.server}:${proxy.port}#${encodeURIComponent(proxy.name)}`;
      }
    });
    console.log(`proxies: ${JSON.stringify(proxies)}`);
    return { 
      nodes: proxies, 
      subInfo: response.headers.get('subscription-userinfo') || ''
    };
  }

  // 替换回真实节点
  private replaceWithRealNodes(convertedConfig: string, fakeNodes: string[], realNodes: string[]): string {
    let result = convertedConfig;
    fakeNodes.forEach((fakeNode, index) => {
      if (realNodes[index]) {
        const realDomain = this.extractDomain(realNodes[index]);
        const fakeDomain = this.extractDomain(fakeNode);
        if (result.includes(fakeDomain)) {
          result = result.replace(fakeDomain, realDomain);
        }
      }
    });
    return result;
  }

  // 转换节点
  public async convert(request: Request, subUrl: string, convertUrl: string, userAgent: string): Promise<{
    text: string;
    headers: { [key: string]: string };
  }> {
    try {
      const { nodes: realNodes, subInfo: realSubInfo } = await this.getRealNodes(subUrl);
      const fakeNodes = this.generateFakeNodes(realNodes);
      const fakeSubContent = fakeNodes.join('\n');
      
      // 使用当前 Worker 的 URL，添加一个专门的路径
      const currentUrl = new URL(request.url);
      // 如果currentUrl.host是本地，则强制使用线上的地址
      let storageUri = `${currentUrl.protocol}//${currentUrl.host}`;
      if (storageUri.includes('127.0.0.1')) {
        storageUri = 'https://node.1024.hair';
      } 
      const fakeSubUrl = `${storageUri}/proxy-content?content=${this.utf8ToBase64(fakeSubContent)}`;
      
      const convertUrlObj = new URL(convertUrl);
      const params = new URLSearchParams(convertUrlObj.search);
      params.set('url', fakeSubUrl);
      convertUrlObj.search = params.toString();
      
      // console.log(`Convert URL: ${convertUrlObj.toString()}`);
      const response = await fetch(convertUrlObj.toString(), {
        headers: {
          'User-Agent': userAgent,
          'Accept': '*/*'
        }
      });
      
      let text = await response.text();
      const headers = Object.fromEntries(response.headers.entries());
      text = this.replaceWithRealNodes(text, fakeNodes, realNodes);
      //console.log(`realHeaders: ${JSON.stringify(realHeaders)}`);
      return { text, headers: { 'subscription-userinfo': realSubInfo } };
    } catch (error) {
      console.error('Node conversion error:', error);
      throw error;
    }
  }
}