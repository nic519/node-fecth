import { parse as yamlParse } from 'yaml';
import { CustomError, ErrorCode } from '@/utils/customError';
import { Base64Utils } from '@/utils/base64Utils';

// 定义节点接口
interface ClashNode {
  name: string;
  type: string;
  server: string;
  port: number;
  cipher?: string;
  password?: string;
  udp?: boolean;
  plugin?: string;
  'plugin-opts'?: {
    mode?: string;
    host?: string;
  };
  uuid?: string;
  alterId?: number;
  network?: string;
  tls?: boolean;
  'skip-cert-verify'?: boolean;
  sni?: string;
  'ws-opts'?: {
    path?: string;
    headers?: { [key: string]: string };
  };
  // SSR特有字段
  protocol?: string;
  obfs?: string;
  'protocol-param'?: string;
  'obfs-param'?: string;
}

// 简化的节点信息接口
interface SimpleNode {
  name: string;
  type: string;
  server: string;
  port: number;
  password?: string;
}

// 输出格式枚举
export enum OutputFormat {
  JSON = 'json',
  SIMPLE = 'simple',
  ORIGINAL_LINKS = 'links'
}

export class ExtractClashNode {
  /// 根据clash的yaml文件提取出节点信息
  private extractNodes(yamlContent: string): ClashNode[] {
    try {
      const yamlObj = yamlParse(yamlContent);
      const proxies = yamlObj.proxies;
      
      // 确保 proxies 是数组类型
      if (!Array.isArray(proxies)) {
        throw new CustomError(
          ErrorCode.NO_PROXIES_FOUND,
          '订阅内容中没有找到有效的代理节点',
          422, // Unprocessable Entity
          { 
            yamlStructure: Object.keys(yamlObj || {}),
            proxiesType: typeof proxies 
          }
        );
      }
      
      if (proxies.length === 0) {
        throw new CustomError(
          ErrorCode.NO_PROXIES_FOUND,
          '订阅内容中的代理节点列表为空',
          422
        );
      }
      
      return proxies;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError(
        ErrorCode.INVALID_YAML,
        'YAML格式解析失败',
        400,
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /// 将节点转换为原始代理链接格式
  private nodeToOriginalLink(node: ClashNode): string {
    const encodedName = encodeURIComponent(node.name);
    
    switch (node.type.toLowerCase()) {
      case 'ss':
      case 'shadowsocks':
        return this.generateShadowsocksLink(node, encodedName);
      
      case 'ssr':
      case 'shadowsocksr':
        return this.generateSsrLink(node, encodedName);
      
      case 'trojan':
        return this.generateTrojanLink(node, encodedName);
      
      case 'vmess':
        return this.generateVmessLink(node, encodedName);
      
      case 'vless':
        return this.generateVlessLink(node, encodedName);
      
      default:
        return `# 不支持的节点类型: ${node.type} - ${node.name}`;
    }
  }

  /// 生成Shadowsocks链接
  private generateShadowsocksLink(node: ClashNode, encodedName: string): string {
    const method = node.cipher || 'aes-128-gcm';
    const password = node.password || '';
    const auth = btoa(`${method}:${password}`);
    let link = `ss://${auth}@${node.server}:${node.port}`;

    // 添加插件参数
    if (node.plugin) {
      const pluginParams = [];
      if (node['plugin-opts']) {
        const opts = node['plugin-opts'];
        if (opts.mode) pluginParams.push(`obfs=${opts.mode}`);
        if (opts.host) pluginParams.push(`obfs-host=${opts.host}`);
      }
      if (pluginParams.length > 0) {
        link += `/?plugin=${encodeURIComponent(`obfs-local;${pluginParams.join(';')}`)}`;
      }
    }

    // 添加UDP参数
    if (node.udp) {
      link += (link.includes('?') ? '&' : '?') + 'udp=1';
    }

    return `${link}#${encodedName}`;
  }

  /// 生成ShadowsocksR链接
  private generateSsrLink(node: ClashNode, encodedName: string): string {
    const server = node.server;
    const port = node.port.toString();
    const protocol = node.protocol || 'origin';
    const method = node.cipher || 'aes-128-ctr';
    const obfs = node.obfs || 'plain';
    
    // 使用Base64Utils进行base64编码，并转换为URL安全格式
    const toBase64UrlSafe = (str: string): string => {
      return Base64Utils.utf8ToBase64(str)
        .replace(/[+/]/g, (match) => match === '+' ? '-' : '_')
        .replace(/=+$/, '');
    };
    
    const password = toBase64UrlSafe(node.password || '');
    
    // SSR链接格式: ssr://server:port:protocol:method:obfs:password_base64/?obfsparam=obfs_param_base64&protoparam=protocol_param_base64&remarks=remarks_base64&group=group_base64
    const baseUrl = `${server}:${port}:${protocol}:${method}:${obfs}:${password}`;
    const params = [];
    
    // 处理obfs参数
    const obfsParam = node['obfs-param'];
    if (obfsParam && obfsParam.trim() !== '') {
      const encodedObfsParam = toBase64UrlSafe(obfsParam);
      params.push(`obfsparam=${encodedObfsParam}`);
    }
    
    // 处理protocol参数
    const protocolParam = node['protocol-param'];
    if (protocolParam && protocolParam.trim() !== '') {
      const encodedProtocolParam = toBase64UrlSafe(protocolParam);
      params.push(`protoparam=${encodedProtocolParam}`);
    }
    
    // 处理备注
    const remarks = toBase64UrlSafe(node.name);
    params.push(`remarks=${remarks}`);
    
    // 处理分组（通常为空）
    const group = toBase64UrlSafe('');
    if (group) {
      params.push(`group=${group}`);
    }

    const paramString = params.length > 0 ? `/?${params.join('&')}` : '';
    const fullUrl = `${baseUrl}${paramString}`;
    
    // 对整个URL进行base64编码，使用URL安全的base64编码
    const encodedUrl = toBase64UrlSafe(fullUrl);
    
    return `ssr://${encodedUrl}`;
  }

  /// 生成Trojan链接
  private generateTrojanLink(node: ClashNode, encodedName: string): string {
    const password = node.password || '';
    const skipCertVerify = node['skip-cert-verify'] ? '1' : '0';
    const sni = node.sni || node.server;
    
    let params = `allowInsecure=${skipCertVerify}`;
    if (sni !== node.server) {
      params += `&peer=${sni}&sni=${sni}`;
    }
    
    return `trojan://${password}@${node.server}:${node.port}?${params}#${encodedName}`;
  }

  /// 生成VMess链接
  private generateVmessLink(node: ClashNode, encodedName: string): string {
    const vmessConfig = {
      v: '2',
      ps: node.name,
      add: node.server,
      port: node.port.toString(),
      id: node.uuid || '',
      aid: (node.alterId || 0).toString(),
      net: node.network || 'tcp',
      type: 'none',
      host: '',
      path: '',
      tls: node.tls ? 'tls' : ''
    };
    
    if (node['ws-opts']) {
      vmessConfig.path = node['ws-opts'].path || '';
      vmessConfig.host = node['ws-opts'].headers?.Host || '';
    }
    
    const configStr = JSON.stringify(vmessConfig);
    const encodedConfig = btoa(configStr);
    return `vmess://${encodedConfig}`;
  }

  /// 生成VLESS链接
  private generateVlessLink(node: ClashNode, encodedName: string): string {
    const uuid = node.uuid || '';
    let params = `type=${node.network || 'tcp'}`;
    
    if (node.tls) {
      params += '&security=tls';
      if (node.sni) {
        params += `&sni=${node.sni}`;
      }
    }
    
    if (node['ws-opts']) {
      params += `&path=${encodeURIComponent(node['ws-opts'].path || '')}`;
      if (node['ws-opts'].headers?.Host) {
        params += `&host=${encodeURIComponent(node['ws-opts'].headers.Host)}`;
      }
    }
    
    return `vless://${uuid}@${node.server}:${node.port}?${params}#${encodedName}`;
  }

  /// 公共方法：提取并返回简化的节点信息
  public getSimpleNodes(yamlContent: string): SimpleNode[] {
    const nodes = this.extractNodes(yamlContent);
    return nodes.map(node => ({
      name: node.name,
      type: node.type,
      server: node.server,
      port: node.port,
      password: node.password
    }));
  }

  /// 公共方法：提取并返回完整的节点信息
  public getAllNodes(yamlContent: string): ClashNode[] {
    return this.extractNodes(yamlContent);
  }

  /// 公共方法：根据格式参数返回不同格式的节点信息
  public getNodes(yamlContent: string, format: OutputFormat = OutputFormat.JSON): string {
    const nodes = this.extractNodes(yamlContent);
    
    switch (format) {
      case OutputFormat.JSON:
        const simpleNodes = nodes.map(node => ({
          name: node.name,
          type: node.type,
          server: node.server,
          port: node.port,
          password: node.password
        }));
        return JSON.stringify(simpleNodes, null, 2);
      
      case OutputFormat.SIMPLE:
        return nodes.map(node => 
          `${node.name} | ${node.type} | ${node.server}:${node.port}`
        ).join('\n');
      
      case OutputFormat.ORIGINAL_LINKS:
        return nodes.map(node => this.nodeToOriginalLink(node)).join('\n');
      
      default:
        return JSON.stringify(nodes, null, 2);
    }
  }
 
  /// 公共方法：获取原始代理链接格式
  public getOriginalLinks(yamlContent: string): string {
    return this.getNodes(yamlContent, OutputFormat.ORIGINAL_LINKS);
  }

  /// 公共方法：按类型筛选节点
  public getNodesByType(yamlContent: string, type: string, format: OutputFormat = OutputFormat.JSON): string {
    const allNodes = this.extractNodes(yamlContent);
    const filteredNodes = allNodes.filter(node => node.type.toLowerCase() === type.toLowerCase());
    
    // 创建临时的yaml内容来重用现有方法
    const tempYaml = { proxies: filteredNodes };
    const tempYamlContent = JSON.stringify(tempYaml);
    
    return this.getNodes(tempYamlContent, format);
  }

  /// 公共方法：按名称关键词筛选节点
  public getNodesByKeyword(yamlContent: string, keyword: string, format: OutputFormat = OutputFormat.JSON): string {
    const allNodes = this.extractNodes(yamlContent);
    const filteredNodes = allNodes.filter(node => node.name.includes(keyword));
    
    // 创建临时的yaml内容来重用现有方法
    const tempYaml = { proxies: filteredNodes };
    const tempYamlContent = JSON.stringify(tempYaml);
    
    return this.getNodes(tempYamlContent, format);
  }
}
