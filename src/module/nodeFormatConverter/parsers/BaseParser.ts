/**
 * 基础解析器抽象类
 * 定义所有协议解析器的通用接口和方法
 */

import { ProxyNode, ParserOptions } from '../models';
import { CustomError, ErrorCode } from '@/utils/customError';

// 解析结果接口
export interface ParseResult<T extends ProxyNode = ProxyNode> {
  /** 是否成功 */
  success: boolean;
  /** 解析的节点 */
  node?: T;
  /** 错误信息 */
  error?: string;
  /** 原始URL */
  originalUrl: string;
}

// 批量解析结果接口
export interface BatchParseResult<T extends ProxyNode = ProxyNode> {
  /** 成功解析的节点 */
  nodes: T[];
  /** 失败的解析 */
  failures: Array<{
    url: string;
    error: string;
  }>;
  /** 统计信息 */
  stats: {
    total: number;
    success: number;
    failed: number;
  };
}

/**
 * 抽象基础解析器类
 */
export abstract class BaseParser<T extends ProxyNode = ProxyNode> {
  protected options: ParserOptions;

  constructor(options: ParserOptions = {}) {
    this.options = {
      strictMode: false,
      skipInvalidNodes: true,
      maxNodes: 1000,
      timeout: 5000,
      ...options
    };
  }

  /**
   * 获取解析器支持的协议前缀
   */
  abstract getSupportedProtocols(): string[];

  /**
   * 解析单个节点URL
   */
  abstract parseNode(url: string): ParseResult<T>;

  /**
   * 验证URL格式是否支持
   */
  canParse(url: string): boolean {
    const protocols = this.getSupportedProtocols();
    return protocols.some(protocol => url.startsWith(protocol));
  }

  /**
   * 解析多个节点URL
   */
  parseMultiple(urls: string[] | string): BatchParseResult<T> {
    const urlList = Array.isArray(urls) ? urls : urls.split('\n');
    const nodes: T[] = [];
    const failures: Array<{ url: string; error: string }> = [];

    for (const url of urlList) {
      const trimmedUrl = url.trim();
      
      // 跳过空行和注释
      if (!trimmedUrl || trimmedUrl.startsWith('#') || trimmedUrl.startsWith('//')) {
        continue;
      }

      // 检查是否支持该协议
      if (!this.canParse(trimmedUrl)) {
        if (this.options.strictMode) {
          failures.push({
            url: trimmedUrl.substring(0, 50) + '...',
            error: '不支持的协议类型'
          });
        }
        continue;
      }

      // 检查节点数量限制
      if (this.options.maxNodes && nodes.length >= this.options.maxNodes) {
        break;
      }

      try {
        const result = this.parseNode(trimmedUrl);
        
        if (result.success && result.node) {
          nodes.push(result.node);
        } else if (!this.options.skipInvalidNodes || this.options.strictMode) {
          failures.push({
            url: trimmedUrl.substring(0, 50) + '...',
            error: result.error || '解析失败'
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (!this.options.skipInvalidNodes || this.options.strictMode) {
          failures.push({
            url: trimmedUrl.substring(0, 50) + '...',
            error: errorMessage
          });
        }
        
        console.warn(`解析节点失败 [${trimmedUrl.substring(0, 20)}...]:`, errorMessage);
      }
    }

    return {
      nodes,
      failures,
      stats: {
        total: urlList.filter(url => url.trim() && !url.trim().startsWith('#')).length,
        success: nodes.length,
        failed: failures.length
      }
    };
  }

  /**
   * 解析base64编码的订阅内容
   */
  parseBase64Subscription(base64Content: string): BatchParseResult<T> {
    try {
      // 解码base64内容
      const decodedContent = this.decodeBase64(base64Content);
      return this.parseMultiple(decodedContent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new CustomError(
        ErrorCode.INVALID_SUBSCRIPTION_FORMAT,
        `订阅内容解析失败: ${errorMessage}`,
        400,
        { originalError: errorMessage }
      );
    }
  }

  /**
   * 生成节点URL
   */
  abstract generateNodeUrl(node: T): string;

  /**
   * 验证节点配置
   */
  protected validateNode(node: Partial<T>): void {
    if (!node.server || typeof node.server !== 'string') {
      throw new Error('服务器地址不能为空');
    }
    
    if (!node.port || node.port <= 0 || node.port > 65535) {
      throw new Error('端口必须在 1-65535 之间');
    }
    
    if (!node.name || typeof node.name !== 'string') {
      throw new Error('节点名称不能为空');
    }
  }

  /**
   * 解码base64字符串
   */
  protected decodeBase64(encoded: string): string {
    try {
      // 处理URL安全的base64编码
      let standardBase64 = encoded
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      // 添加必要的填充
      const paddingLength = (4 - (standardBase64.length % 4)) % 4;
      standardBase64 += '='.repeat(paddingLength);

      return atob(standardBase64);
    } catch (error) {
      throw new Error(`Base64解码失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 编码为URL安全的base64
   */
  protected encodeBase64UrlSafe(text: string): string {
    return btoa(text)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * 解析URL查询参数
   */
  protected parseQueryParams(queryString: string): Record<string, string> {
    const params: Record<string, string> = {};
    
    if (!queryString) {
      return params;
    }

    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value !== undefined) {
        try {
          params[key] = decodeURIComponent(value);
        } catch {
          params[key] = value;
        }
      }
    }

    return params;
  }

  /**
   * 构建查询参数字符串
   */
  protected buildQueryParams(params: Record<string, string | undefined>): string {
    const pairs: string[] = [];
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        pairs.push(`${key}=${encodeURIComponent(value)}`);
      }
    }
    
    return pairs.length > 0 ? `?${pairs.join('&')}` : '';
  }

  /**
   * 生成安全的节点名称
   */
  protected generateSafeName(baseName: string, server: string, port: number): string {
    if (baseName && baseName.trim()) {
      return baseName.trim();
    }
    
    return `${this.getSupportedProtocols()[0].replace('://', '').toUpperCase()}-${server}:${port}`;
  }

  /**
   * 更新解析器选项
   */
  updateOptions(newOptions: Partial<ParserOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * 获取当前解析器选项
   */
  getOptions(): ParserOptions {
    return { ...this.options };
  }
}

/**
 * 解析器工厂注册表
 */
export class ParserRegistry {
  private static parsers = new Map<string, () => BaseParser>();

  /**
   * 注册解析器
   */
  static register(protocols: string[], parserFactory: () => BaseParser): void {
    for (const protocol of protocols) {
      this.parsers.set(protocol.toLowerCase(), parserFactory);
    }
  }

  /**
   * 获取支持指定协议的解析器
   */
  static getParser(protocol: string): BaseParser | null {
    const factory = this.parsers.get(protocol.toLowerCase());
    return factory ? factory() : null;
  }

  /**
   * 获取支持指定URL的解析器
   */
  static getParserForUrl(url: string): BaseParser | null {
    for (const [protocol, factory] of this.parsers) {
      if (url.toLowerCase().startsWith(protocol)) {
        return factory();
      }
    }
    return null;
  }

  /**
   * 获取所有支持的协议
   */
  static getSupportedProtocols(): string[] {
    return Array.from(this.parsers.keys());
  }

  /**
   * 清空注册表
   */
  static clear(): void {
    this.parsers.clear();
  }
}
