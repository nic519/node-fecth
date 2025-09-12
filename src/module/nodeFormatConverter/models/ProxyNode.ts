/**
 * 代理节点数据模型
 * 统一的节点数据结构，支持各种协议类型
 */

// 基础节点接口
export interface BaseProxyNode {
  /** 节点名称 */
  name: string;
  /** 服务器地址 */
  server: string;
  /** 端口 */
  port: number;
  /** 协议类型 */
  type: ProxyProtocol;
  /** 备注信息 */
  remarks?: string;
  /** 分组信息 */
  group?: string;
}

// 支持的协议类型
export enum ProxyProtocol {
  SHADOWSOCKS = 'ss',
  SHADOWSOCKSR = 'ssr',
  VMESS = 'vmess',
  VLESS = 'vless',
  TROJAN = 'trojan',
  HYSTERIA = 'hysteria',
  HYSTERIA2 = 'hysteria2'
}

// Shadowsocks 节点
export interface ShadowsocksNode extends BaseProxyNode {
  type: ProxyProtocol.SHADOWSOCKS;
  /** 加密方式 */
  cipher: string;
  /** 密码 */
  password: string;
  /** 是否启用UDP */
  udp?: boolean;
  /** 插件 */
  plugin?: string;
  /** 插件选项 */
  pluginOpts?: Record<string, any>;
}

// ShadowsocksR 节点
export interface ShadowsocksRNode extends BaseProxyNode {
  type: ProxyProtocol.SHADOWSOCKSR;
  /** 加密方式 */
  cipher: string;
  /** 密码 */
  password: string;
  /** 协议 */
  protocol: string;
  /** 混淆 */
  obfs: string;
  /** 协议参数 */
  protocolParam?: string;
  /** 混淆参数 */
  obfsParam?: string;
  /** 是否启用UDP */
  udp?: boolean;
}

// VMess 节点
export interface VmessNode extends BaseProxyNode {
  type: ProxyProtocol.VMESS;
  /** UUID */
  uuid: string;
  /** AlterID */
  alterId: number;
  /** 加密方式 */
  cipher: string;
  /** 网络类型 */
  network: string;
  /** 是否启用TLS */
  tls?: boolean;
  /** WebSocket选项 */
  wsOpts?: {
    path?: string;
    headers?: Record<string, string>;
  };
  /** HTTP/2选项 */
  h2Opts?: {
    host?: string[];
    path?: string;
  };
  /** gRPC选项 */
  grpcOpts?: {
    serviceName?: string;
  };
  /** 跳过证书验证 */
  skipCertVerify?: boolean;
  /** SNI */
  sni?: string;
}

// VLESS 节点
export interface VlessNode extends BaseProxyNode {
  type: ProxyProtocol.VLESS;
  /** UUID */
  uuid: string;
  /** 加密方式 */
  encryption: string;
  /** 流控 */
  flow?: string;
  /** 网络类型 */
  network: string;
  /** 是否启用TLS */
  tls?: boolean;
  /** WebSocket选项 */
  wsOpts?: {
    path?: string;
    headers?: Record<string, string>;
  };
  /** TCP选项 */
  tcpOpts?: {
    headerType?: string;
    request?: any;
    response?: any;
  };
  /** gRPC选项 */
  grpcOpts?: {
    serviceName?: string;
  };
  /** 跳过证书验证 */
  skipCertVerify?: boolean;
  /** SNI */
  sni?: string;
}

// Trojan 节点
export interface TrojanNode extends BaseProxyNode {
  type: ProxyProtocol.TROJAN;
  /** 密码 */
  password: string;
  /** 是否启用TLS */
  tls?: boolean;
  /** 跳过证书验证 */
  skipCertVerify?: boolean;
  /** SNI */
  sni?: string;
  /** ALPN */
  alpn?: string[];
  /** WebSocket选项 */
  wsOpts?: {
    path?: string;
    headers?: Record<string, string>;
  };
}

// Hysteria 节点
export interface HysteriaNode extends BaseProxyNode {
  type: ProxyProtocol.HYSTERIA;
  /** 认证字符串 */
  auth?: string;
  /** 认证字符串（Base64） */
  authStr?: string;
  /** 上行速度 */
  up?: string;
  /** 下行速度 */
  down?: string;
  /** 跳过证书验证 */
  skipCertVerify?: boolean;
  /** SNI */
  sni?: string;
  /** ALPN */
  alpn?: string[];
}

// Hysteria2 节点
export interface Hysteria2Node extends BaseProxyNode {
  type: ProxyProtocol.HYSTERIA2;
  /** 密码 */
  password: string;
  /** 上行速度 */
  up?: string;
  /** 下行速度 */
  down?: string;
  /** 跳过证书验证 */
  skipCertVerify?: boolean;
  /** SNI */
  sni?: string;
}

// 联合类型：所有支持的节点类型
export type ProxyNode = 
  | ShadowsocksNode 
  | ShadowsocksRNode 
  | VmessNode 
  | VlessNode 
  | TrojanNode 
  | HysteriaNode 
  | Hysteria2Node;

// 节点验证器
export class ProxyNodeValidator {
  /**
   * 验证基础节点信息
   */
  static validateBase(node: Partial<BaseProxyNode>): void {
    if (!node.server || typeof node.server !== 'string') {
      throw new Error('服务器地址不能为空');
    }
    
    if (!node.port || node.port <= 0 || node.port > 65535) {
      throw new Error('端口必须在 1-65535 之间');
    }
    
    if (!node.type || !Object.values(ProxyProtocol).includes(node.type)) {
      throw new Error('不支持的协议类型');
    }
  }

  /**
   * 验证 Shadowsocks 节点
   */
  static validateShadowsocks(node: Partial<ShadowsocksNode>): void {
    this.validateBase(node);
    
    if (!node.cipher) {
      throw new Error('Shadowsocks 节点必须指定加密方式');
    }
    
    if (!node.password) {
      throw new Error('Shadowsocks 节点必须指定密码');
    }
  }

  /**
   * 验证 ShadowsocksR 节点
   */
  static validateShadowsocksR(node: Partial<ShadowsocksRNode>): void {
    this.validateBase(node);
    
    if (!node.cipher || !node.password || !node.protocol || !node.obfs) {
      throw new Error('ShadowsocksR 节点缺少必需参数');
    }
  }

  /**
   * 验证 VMess 节点
   */
  static validateVmess(node: Partial<VmessNode>): void {
    this.validateBase(node);
    
    if (!node.uuid) {
      throw new Error('VMess 节点必须指定 UUID');
    }
    
    if (node.alterId === undefined || node.alterId < 0) {
      throw new Error('VMess 节点 AlterID 无效');
    }
  }

  /**
   * 验证代理节点
   */
  static validate(node: Partial<ProxyNode>): void {
    switch (node.type) {
      case ProxyProtocol.SHADOWSOCKS:
        this.validateShadowsocks(node as Partial<ShadowsocksNode>);
        break;
      case ProxyProtocol.SHADOWSOCKSR:
        this.validateShadowsocksR(node as Partial<ShadowsocksRNode>);
        break;
      case ProxyProtocol.VMESS:
        this.validateVmess(node as Partial<VmessNode>);
        break;
      case ProxyProtocol.VLESS:
        this.validateBase(node);
        break;
      case ProxyProtocol.TROJAN:
        this.validateBase(node);
        if (!(node as Partial<TrojanNode>).password) {
          throw new Error('Trojan 节点必须指定密码');
        }
        break;
      default:
        throw new Error(`不支持的协议类型: ${node.type}`);
    }
  }
}

// 节点工厂类
export class ProxyNodeFactory {
  /**
   * 创建 Shadowsocks 节点
   */
  static createShadowsocks(config: {
    name: string;
    server: string;
    port: number;
    cipher: string;
    password: string;
    udp?: boolean;
    plugin?: string;
    pluginOpts?: Record<string, any>;
    remarks?: string;
    group?: string;
  }): ShadowsocksNode {
    const node: ShadowsocksNode = {
      type: ProxyProtocol.SHADOWSOCKS,
      name: config.name,
      server: config.server,
      port: config.port,
      cipher: config.cipher,
      password: config.password,
      udp: config.udp,
      plugin: config.plugin,
      pluginOpts: config.pluginOpts,
      remarks: config.remarks,
      group: config.group
    };
    
    ProxyNodeValidator.validate(node);
    return node;
  }

  /**
   * 创建 ShadowsocksR 节点
   */
  static createShadowsocksR(config: {
    name: string;
    server: string;
    port: number;
    cipher: string;
    password: string;
    protocol: string;
    obfs: string;
    protocolParam?: string;
    obfsParam?: string;
    udp?: boolean;
    remarks?: string;
    group?: string;
  }): ShadowsocksRNode {
    const node: ShadowsocksRNode = {
      type: ProxyProtocol.SHADOWSOCKSR,
      name: config.name,
      server: config.server,
      port: config.port,
      cipher: config.cipher,
      password: config.password,
      protocol: config.protocol,
      obfs: config.obfs,
      protocolParam: config.protocolParam,
      obfsParam: config.obfsParam,
      udp: config.udp,
      remarks: config.remarks,
      group: config.group
    };
    
    ProxyNodeValidator.validate(node);
    return node;
  }

  /**
   * 创建 VMess 节点
   */
  static createVmess(config: {
    name: string;
    server: string;
    port: number;
    uuid: string;
    alterId: number;
    cipher: string;
    network: string;
    tls?: boolean;
    wsOpts?: any;
    h2Opts?: any;
    grpcOpts?: any;
    skipCertVerify?: boolean;
    sni?: string;
    remarks?: string;
    group?: string;
  }): VmessNode {
    const node: VmessNode = {
      type: ProxyProtocol.VMESS,
      name: config.name,
      server: config.server,
      port: config.port,
      uuid: config.uuid,
      alterId: config.alterId,
      cipher: config.cipher,
      network: config.network,
      tls: config.tls,
      wsOpts: config.wsOpts,
      h2Opts: config.h2Opts,
      grpcOpts: config.grpcOpts,
      skipCertVerify: config.skipCertVerify,
      sni: config.sni,
      remarks: config.remarks,
      group: config.group
    };
    
    ProxyNodeValidator.validate(node);
    return node;
  }
}
