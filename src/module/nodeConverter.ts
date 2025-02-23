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
  private async getRealNodes(subUrl: string): Promise<string[]> {
    const response = await fetch(subUrl);
    let text = await response.text();
    // 如果结果是base64编码，则先解码
    if (text.endsWith('=')) {
      text = atob(text);
    }
    const proxies = text.split('\n').map(line => line.trim()).filter(line => line);
    return proxies;
  }

  // 替换回真实节点
  private replaceWithRealNodes(convertedConfig: string, fakeNodes: string[], realNodes: string[]): string {
    let result = convertedConfig;
    console.log(`result: ${result.substring(200, 800)}`);
    fakeNodes.forEach((fakeNode, index) => {
      if (realNodes[index]) {
        const realDomain = this.extractDomain(realNodes[index]);
        const fakeDomain = this.extractDomain(fakeNode);
        console.log(`fakeNode: ${fakeDomain}->${realDomain}`);
        if (result.includes(fakeDomain)) {
          console.log(`replace ${fakeDomain} with ${realDomain}`);
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
      const realNodes = await this.getRealNodes(subUrl);
      const fakeNodes = this.generateFakeNodes(realNodes);
      const fakeSubContent = fakeNodes.join('\n');
      
      // 使用当前 Worker 的 URL，添加一个专门的路径
      const currentUrl = new URL(request.url);
      const fakeSubUrl = `${currentUrl.protocol}//${currentUrl.host}/proxy-content?content=${this.utf8ToBase64(fakeSubContent)}`;
      // console.log(`fakeSubUrl: ${fakeSubUrl}`);
      // const fakeSubUrl = "https://node.1024.hair/proxy-content?content=dHJvamFuOi8vYTdhMzVjYzctNDEzNy00YjJmLWEzZTctNGJkYjQyODc2YjJhQGM5enc3Lm43enRyOXUuY29tOjIxNzk4OjQwMjY5P2FsbG93SW5zZWN1cmU9MSZwZWVyPWkwLmhkc2xiLmNvbSZzbmk9aTAuaGRzbGIuY29tIyVGMCU5RiU4NyVBRCVGMCU5RiU4NyVCMCUyMCVFOSVBNiU5OSVFNiVCOCVBRjAwCnNzOi8vWVdWekxURXlPQzFuWTIwNllUZGhNelZqWXpjdE5ERXpOeTAwWWpKbUxXRXpaVGN0TkdKa1lqUXlPRGMyWWpKaEAxcmVtYS5uN3p0cjl1LmNvbToyMzg3Mjo0MDY2MiMlRjAlOUYlODclQUQlRjAlOUYlODclQjAlMjAlRTklQTYlOTklRTYlQjglQUYwMQpzczovL1lXVnpMVEV5T0MxblkyMDZZVGRoTXpWall6Y3ROREV6TnkwMFlqSm1MV0V6WlRjdE5HSmtZalF5T0RjMllqSmhAc3NibHkubjd6dHI5dS5jb206MjkzMzM6NDAwOTcjJUYwJTlGJTg3JUFEJUYwJTlGJTg3JUIwJTIwJUU5JUE2JTk5JUU2JUI4JUFGMDIKc3M6Ly9ZV1Z6TFRFeU9DMW5ZMjA2WVRkaE16VmpZemN0TkRFek55MDBZakptTFdFelpUY3ROR0prWWpReU9EYzJZakpoQGM5dTl1Lm43enRyOXUuY29tOjYxMjY6NDE5ODkjJUYwJTlGJTg3JUFEJUYwJTlGJTg3JUIwJTIwJUU5JUE2JTk5JUU2JUI4JUFGMDMKc3M6Ly9ZV1Z6TFRFeU9DMW5ZMjA2WVRkaE16VmpZemN0TkRFek55MDBZakptTFdFelpUY3ROR0prWWpReU9EYzJZakpoQGM4NXBlLm43enRyOXUuY29tOjM1Nzg0OjQyMDg4IyVGMCU5RiU4NyVBRCVGMCU5RiU4NyVCMCUyMCVFOSVBNiU5OSVFNiVCOCVBRjA0CnNzOi8vWVdWekxURXlPQzFuWTIwNllUZGhNelZqWXpjdE5ERXpOeTAwWWpKbUxXRXpaVGN0TkdKa1lqUXlPRGMyWWpKaEB0Y3dhdy5uN3p0cjl1LmNvbTo0MTU3MTo0NjY1MyMlRjAlOUYlODclQTglRjAlOUYlODclQjMlMjAlRTUlOEYlQjAlRTYlQjklQkUwMQpzczovL1lXVnpMVEV5T0MxblkyMDZZVGRoTXpWall6Y3ROREV6TnkwMFlqSm1MV0V6WlRjdE5HSmtZalF5T0RjMllqSmhAd29oNTcubjd6dHI5dS5jb206NDI2NDE6NDU2NTgjJUYwJTlGJTg3JUE4JUYwJTlGJTg3JUIzJTIwJUU1JThGJUIwJUU2JUI5JUJFMDIKc3M6Ly9ZV1Z6TFRFeU9DMW5ZMjA2WVRkaE16VmpZemN0TkRFek55MDBZakptTFdFelpUY3ROR0prWWpReU9EYzJZakpoQGIwaDE0Lm43enRyOXUuY29tOjM5NTQ5OjQzMzgzIyVGMCU5RiU4NyVBOCVGMCU5RiU4NyVCMyUyMCVFNSU4RiVCMCVFNiVCOSVCRTAzCnNzOi8vWVdWekxURXlPQzFuWTIwNllUZGhNelZqWXpjdE5ERXpOeTAwWWpKbUxXRXpaVGN0TkdKa1lqUXlPRGMyWWpKaEAzMGR5ei5uN3p0cjl1LmNvbTozNzQxNDo0NjE1MSMlRjAlOUYlODclQjglRjAlOUYlODclQUMlMjAlRTYlOTYlQjAlRTUlOEElQTAlRTUlOUQlQTEwMQpzczovL1lXVnpMVEV5T0MxblkyMDZZVGRoTXpWall6Y3ROREV6TnkwMFlqSm1MV0V6WlRjdE5HSmtZalF5T0RjMllqSmhAMjdyczQubjd6dHI5dS5jb206NTA1Njg6NDQ2NzAjJUYwJTlGJTg3JUI4JUYwJTlGJTg3JUFDJTIwJUU2JTk2JUIwJUU1JThBJUEwJUU1JTlEJUExMDIKc3M6Ly9ZV1Z6TFRFeU9DMW5ZMjA2WVRkaE16VmpZemN0TkRFek55MDBZakptTFdFelpUY3ROR0prWWpReU9EYzJZakpoQGUyNDA0Lm43enRyOXUuY29tOjE2OTQ0OjQxNTMwIyVGMCU5RiU4NyVCOCVGMCU5RiU4NyVBQyUyMCVFNiU5NiVCMCVFNSU4QSVBMCVFNSU5RCVBMTAzCnNzOi8vWVdWekxURXlPQzFuWTIwNllUZGhNelZqWXpjdE5ERXpOeTAwWWpKbUxXRXpaVGN0TkdKa1lqUXlPRGMyWWpKaEBsMmdwbC5uN3p0cjl1LmNvbTo1NTAyMDo0MjQ5MiMlRjAlOUYlODclQUYlRjAlOUYlODclQjUlMjAlRTYlOTclQTUlRTYlOUMlQUMwMQpzczovL1lXVnpMVEV5T0MxblkyMDZZVGRoTXpWall6Y3ROREV6TnkwMFlqSm1MV0V6WlRjdE5HSmtZalF5T0RjMllqSmhAc3pnMHgubjd6dHI5dS5jb206NTU4NTE6NDQ5NTEjJUYwJTlGJTg3JUFGJUYwJTlGJTg3JUI1JTIwJUU2JTk3JUE1JUU2JTlDJUFDMDIKc3M6Ly9ZV1Z6TFRFeU9DMW5ZMjA2WVRkaE16VmpZemN0TkRFek55MDBZakptTFdFelpUY3ROR0prWWpReU9EYzJZakpoQGtpaTB6Lm43enRyOXUuY29tOjkxNTU6NDQzMDEjJUYwJTlGJTg3JUFGJUYwJTlGJTg3JUI1JTIwJUU2JTk3JUE1JUU2JTlDJUFDMDMKc3M6Ly9ZV1Z6TFRFeU9DMW5ZMjA2WVRkaE16VmpZemN0TkRFek55MDBZakptTFdFelpUY3ROR0prWWpReU9EYzJZakpoQHRueHd4Lm43enRyOXUuY29tOjQyOTU0OjQzODkyIyVGMCU5RiU4NyVCMiVGMCU5RiU4NyVCNCUyMCVFNiVCRSVCMyVFOSU5NyVBODAxCnNzOi8vWVdWekxURXlPQzFuWTIwNllUZGhNelZqWXpjdE5ERXpOeTAwWWpKbUxXRXpaVGN0TkdKa1lqUXlPRGMyWWpKaEBqb3czNy5uN3p0cjl1LmNvbTo2NTE5Njo0MTA5NiMlRjAlOUYlODclQUUlRjAlOUYlODclQTklMjAlRTUlOEQlQjAlRTUlQjAlQkMwMQpzczovL1lXVnpMVEV5T0MxblkyMDZZVGRoTXpWall6Y3ROREV6TnkwMFlqSm1MV0V6WlRjdE5HSmtZalF5T0RjMllqSmhAM3ViaGcubjd6dHI5dS5jb206MTgyOTM6NDM3MzcjJUYwJTlGJTlBJUE5JTIwJUU0JUI4JTkzJUU3JTk0JUE4JTIwJTdDJTIwRW1ieQpzczovL1lXVnpMVEV5T0MxblkyMDZZVGRoTXpWall6Y3ROREV6TnkwMFlqSm1MV0V6WlRjdE5HSmtZalF5T0RjMllqSmhAZHoxMHgubjd6dHI5dS5jb206MTgyOTk6NDI4MTQjJUYwJTlGJTg3JUIwJUYwJTlGJTg3JUI3JTIwJUU5JTlGJUE5JUU1JTlCJUJEMDEKc3M6Ly9ZV1Z6TFRFeU9DMW5ZMjA2WVRkaE16VmpZemN0TkRFek55MDBZakptTFdFelpUY3ROR0prWWpReU9EYzJZakpoQDQ2OXBhLm43enRyOXUuY29tOjI0MDQzOjQzNTUyIyVGMCU5RiU4NyVCQSVGMCU5RiU4NyVCOCUyMCVFNyVCRSU4RSVFNSU5QiVCRDAxCnNzOi8vWVdWekxURXlPQzFuWTIwNllUZGhNelZqWXpjdE5ERXpOeTAwWWpKbUxXRXpaVGN0TkdKa1lqUXlPRGMyWWpKaEA1NG9lMC5uN3p0cjl1LmNvbToyMTMxNzo0NjA4OSMlRjAlOUYlODclQkElRjAlOUYlODclQjglMjAlRTclQkUlOEUlRTUlOUIlQkQwMgpzczovL1lXVnpMVEV5T0MxblkyMDZZVGRoTXpWall6Y3ROREV6TnkwMFlqSm1MV0V6WlRjdE5HSmtZalF5T0RjMllqSmhANWp2aTAubjd6dHI5dS5jb206NDQ1MjA6NDAwODMjJUYwJTlGJTg3JUJBJUYwJTlGJTg3JUI4JTIwJUU3JUJFJThFJUU1JTlCJUJEMDMKc3M6Ly9ZV1Z6TFRFeU9DMW5ZMjA2WVRkaE16VmpZemN0TkRFek55MDBZakptTFdFelpUY3ROR0prWWpReU9EYzJZakpoQHo0cnR1Lm43enRyOXUuY29tOjc1NTU6NDE3MjcjJUYwJTlGJTg3JUE5JUYwJTlGJTg3JUFBJTIwJUU1JUJFJUI3JUU1JTlCJUJEMDEKc3M6Ly9ZV1Z6TFRFeU9DMW5ZMjA2WVRkaE16VmpZemN0TkRFek55MDBZakptTFdFelpUY3ROR0prWWpReU9EYzJZakpoQGh6cWdqLm43enRyOXUuY29tOjM5NDYzOjQ1NjMxIyVGMCU5RiU4NyVCOSVGMCU5RiU4NyVCNyUyMCVFNSU5QyU5RiVFOCU4MCVCMyVFNSU4NSVCNjAx"
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
      
      return { text, headers };
    } catch (error) {
      console.error('Node conversion error:', error);
      throw error;
    }
  }
}