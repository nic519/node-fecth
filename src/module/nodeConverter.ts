// 节点转换器类
import { parse as yamlParse } from 'yaml';
import { Base64Utils } from '../utils/base64Utils';
import { Routes } from '../routes/routesConfig';

export class NodeConverter {
   
  // 生成假节点
  private generateFakeNodes(realNodes: string[]): string[] {
    const randomString = Math.random().toString(36).substring(2, 7);
    const randomUrl = `${randomString}.io`;

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
    // 从原始节点信息中，提取域名
    const domain = node.match(/(?<=@).*?(?=:)/)?.[0];
    if (!domain) return node;  // 如果没有匹配到域名，返回原始节点
    return domain;
  }


  private getProxiesByYaml(text: string): string[] {
    const yaml = yamlParse(text);
    const proxiesObj = yaml.proxies;
    const proxies = proxiesObj.map((proxy: any) => {
      // yaml里的proxy转成普通格式，要一个一个写，有点麻烦，所以改成多请求一次接口，直接获取节点列表
      if (proxy.type === 'trojan') {
        return `${proxy.type}://${proxy.password}@${proxy.server}:${proxy.port}?allowInsecure=1&peer=${proxy.sni}&sni=${proxy.sni}#${encodeURIComponent(proxy.name)}`;
      } else if (proxy.type === 'ss') {
        // 将 cipher:password 组合并进行 base64 编码
        const userinfo = Base64Utils.utf8ToBase64(`${proxy.cipher}:${proxy.password}`);
        return `ss://${userinfo}@${proxy.server}:${proxy.port}#${encodeURIComponent(proxy.name)}`;
      }
    });
    return proxies;
  }

  private getProxiesByRaw(base64Text: string): string[] {
    const text = Base64Utils.base64ToUtf8(base64Text);
    // 处理不同操作系统的换行符，并过滤空行
    const proxies = text.split(/\r?\n/).filter(line => line.trim() !== '');
    return proxies;
  }

  // 获取真实节点
  private async getRealNodes(subUrl: string): Promise<{nodes: string[], subInfo: string }> {
    // 并发执行两个fetch请求
    const [responseRaw, responseClash] = await Promise.all([
      fetch(subUrl),
      fetch(subUrl, {
        headers: {
          'User-Agent': 'clash 1.10.0'
        }
      })
    ]);

    const subInfo = responseClash.headers.get('subscription-userinfo') || '';
    const textRaw = await responseRaw.text();
    const proxies = this.getProxiesByRaw(textRaw);

    return {
      nodes: proxies, 
      subInfo: subInfo 
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

  private buildFakeSubUrl(fakeNodes: string[], request: Request): string {
    // 使用当前 Worker 的 URL，添加一个专门的路径
    const fakeContent = Base64Utils.utf8ToBase64(fakeNodes.join('\n'));
    const currentUrl = new URL(request.url);
    let storageUri = `${currentUrl.protocol}//${currentUrl.host}`;
    if (storageUri.includes('127.0.0.1')) {
      storageUri = 'https://node.1024.hair';
    }
    const fakeSubUrl = `${storageUri}${Routes.storage}?v=${fakeContent}`;
    // console.log(`fakeSubUrl: ${fakeSubUrl}`);
    return fakeSubUrl;
  }

  // 获取订阅信息
  public async convert(
    request: Request, 
    subUrl: string, 
    convertUrl: string, 
    userAgent: string
  ): Promise<{
    text: string;
    headers: { [key: string]: string };
  }> {
    try {
      const { nodes: realNodes, subInfo: realSubInfo } = await this.getRealNodes(subUrl);
      const fakeNodes = this.generateFakeNodes(realNodes);
      const fakeSubUrl = this.buildFakeSubUrl(fakeNodes, request);
      
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
      text = this.replaceWithRealNodes(text, fakeNodes, realNodes);
      //console.log(`realHeaders: ${JSON.stringify(realHeaders)}`);
      return { text, headers: { 'subscription-userinfo': realSubInfo } };
    } catch (error) {
      console.error('Node conversion error:', error);
      throw error;
    }
  }
}