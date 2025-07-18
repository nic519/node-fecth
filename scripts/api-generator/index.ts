/**
 * ===================================================================
 * 🚀 API 生成器模块导出
 * ===================================================================
 */

// 核心模块
export { ApiGenerator } from './core/ApiGenerator';
export type * from './core/types';

// 获取器模块
export { OpenApiSpecFetcher } from './fetchers/OpenApiSpecFetcher';

// 生成器模块
export { ModularExportGenerator } from './generators/ModularExportGenerator';
export { OazapftsGenerator } from './generators/OazapftsGenerator';

// 分析器模块
export { FunctionAnalyzer } from './analyzers/FunctionAnalyzer';
export { ModuleResolver } from './analyzers/ModuleResolver';

// 工具模块
export { FileManager } from './utils/FileManager';
export { PathResolver } from './utils/PathResolver';
