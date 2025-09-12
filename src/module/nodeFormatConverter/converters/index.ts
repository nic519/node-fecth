/**
 * 转换器模块导出文件
 */

// 基础转换器
export * from './BaseConverter';

// 具体格式转换器
export * from './ClashConverter';

// 导入其他转换器（当它们被创建时）
// export * from './SurgeConverter';
// export * from './QuantumultXConverter';

// 转换器工厂
import { ConverterRegistry } from './BaseConverter';
import { ClashConverter } from './ClashConverter';

/**
 * 初始化所有转换器
 */
export function initializeConverters(): void {
  // 清空现有注册
  ConverterRegistry.clear();
  
  // 注册 Clash 转换器
  ConverterRegistry.register(
    ['nodes', 'proxy-nodes'],
    ['clash', 'clash-yaml', 'clash-json'],
    () => new ClashConverter()
  );
  
  // TODO: 注册其他转换器
  // ConverterRegistry.register(['nodes'], ['surge'], () => new SurgeConverter());
  // ConverterRegistry.register(['nodes'], ['quantumult-x'], () => new QuantumultXConverter());
}

/**
 * 统一转换器工厂类
 */
export class UniversalConverter {
  private static initialized = false;

  /**
   * 确保转换器已初始化
   */
  private static ensureInitialized(): void {
    if (!this.initialized) {
      initializeConverters();
      this.initialized = true;
    }
  }

  /**
   * 执行转换
   */
  static convert(
    input: any,
    sourceFormat: string,
    targetFormat: string,
    options: any = {}
  ) {
    this.ensureInitialized();
    
    const converter = ConverterRegistry.getConverter(sourceFormat, targetFormat);
    if (!converter) {
      throw new Error(`不支持的转换: ${sourceFormat} -> ${targetFormat}`);
    }
    
    return converter.convert(input, { 
      sourceFormat, 
      targetFormat,
      options 
    });
  }

  /**
   * 检查是否支持指定转换
   */
  static canConvert(sourceFormat: string, targetFormat: string): boolean {
    this.ensureInitialized();
    return ConverterRegistry.canConvert(sourceFormat, targetFormat);
  }

  /**
   * 获取支持的转换列表
   */
  static getSupportedConversions(): Array<{ source: string; target: string }> {
    this.ensureInitialized();
    return ConverterRegistry.getSupportedConversions();
  }

  /**
   * 重新初始化转换器
   */
  static reinitialize(): void {
    this.initialized = false;
    this.ensureInitialized();
  }
}
