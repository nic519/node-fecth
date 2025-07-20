/**
 * ===================================================================
 * 🚀 API 生成器核心类型定义
 * ===================================================================
 */

/**
 * 函数信息接口
 */
export interface FunctionInfo {
	name: string;
	description: string;
	module: string;
}

/**
 * 模块分组结果
 */
export type ModuleGroups = Record<string, FunctionInfo[]>;

/**
 * API 生成器配置
 */
export interface ApiGeneratorConfig {
	/** 服务器URL */
	serverUrl: string;
	/** 输出目录 */
	outputDir: string; 
	/** 客户端文件路径 */
	clientPath: string;
	/** 适配器文件路径 */
	adaptersPath: string;
	/** 临时OpenAPI文件路径 */
	tempOpenapiPath: string;
}

/**
 * OpenAPI 规范获取器接口
 */
export interface IOpenApiSpecFetcher {
	/**
	 * 获取 OpenAPI 规范
	 * @param serverUrl 服务器URL
	 * @param outputPath 输出文件路径
	 */
	fetchSpec(serverUrl: string, outputPath: string): Promise<void>;
}

/**
 * oazapfts 生成器接口
 */
export interface IOazapftsGenerator {
	/**
	 * 生成 oazapfts 客户端
	 * @param openapiPath OpenAPI 规范文件路径
	 * @param outputPath 输出文件路径
	 */
	generateClient(openapiPath: string, outputPath: string): Promise<void>;
}

/**
 * 函数分析器接口
 */
export interface IFunctionAnalyzer {
	/**
	 * 分析客户端文件中的函数
	 * @param clientPath 客户端文件路径
	 */
	analyzeFunctions(clientPath: string): FunctionInfo[];
}

/**
 * 模块解析器接口
 */
export interface IModuleResolver {
	/**
	 * 基于函数名确定模块
	 * @param functionName 函数名
	 */
	resolveModule(functionName: string): string;

	/**
	 * 按模块分组函数
	 * @param functions 函数列表
	 */
	groupByModule(functions: FunctionInfo[]): ModuleGroups;
}

/**
 * 模块化导出生成器接口
 */
export interface IModularExportGenerator {
	/**
	 * 生成模块化导出内容
	 * @param functions 函数列表
	 * @param modules 模块分组
	 */
	generateExportContent(functions: FunctionInfo[], modules: ModuleGroups): string;
}

/**
 * 文件管理器接口
 */
export interface IFileManager {
	/**
	 * 确保目录存在
	 * @param dirPath 目录路径
	 */
	ensureDirectoryExists(dirPath: string): void;

	/**
	 * 清理临时文件
	 * @param filePath 文件路径
	 */
	cleanupTempFile(filePath: string): void;

	/**
	 * 添加文件头部配置
	 * @param filePath 文件路径
	 * @param apiBaseUrl API基础URL
	 */
	addBasicConfiguration(filePath: string, apiBaseUrl: string): void;
}

/**
 * 路径解析器接口
 */
export interface IPathResolver {
	/**
	 * 解析所有相关路径
	 * @param serverUrl 服务器URL
	 */
	resolvePaths(serverUrl?: string): ApiGeneratorConfig;
}
