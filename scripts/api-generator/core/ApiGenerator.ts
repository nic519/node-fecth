/**
 * ===================================================================
 * 🚀 核心 API 生成器
 * ===================================================================
 */

import * as fs from 'fs';
import type {
	ApiGeneratorConfig,
	IFileManager,
	IFunctionAnalyzer,
	IModularExportGenerator,
	IModuleResolver,
	IOazapftsGenerator,
	IOpenApiSpecFetcher,
	IPathResolver,
} from './types';

import { FunctionAnalyzer } from '../analyzers/FunctionAnalyzer';
import { ModuleResolver } from '../analyzers/ModuleResolver';
import { OpenApiSpecFetcher } from '../fetchers/OpenApiSpecFetcher';
import { ModularExportGenerator } from '../generators/ModularExportGenerator';
import { OazapftsGenerator } from '../generators/OazapftsGenerator';
import { FileManager } from '../utils/FileManager';
import { PathResolver } from '../utils/PathResolver';

/**
 * 零硬编码 API 客户端生成器
 * 遵循 Hono 最佳实践
 */
export class ApiGenerator {
	private config: ApiGeneratorConfig;
	private openApiSpecFetcher: IOpenApiSpecFetcher;
	private oazapftsGenerator: IOazapftsGenerator;
	private functionAnalyzer: IFunctionAnalyzer;
	private moduleResolver: IModuleResolver;
	private modularExportGenerator: IModularExportGenerator;
	private fileManager: IFileManager;
	private pathResolver: IPathResolver;

	constructor(serverUrl?: string) {
		// 依赖注入初始化所有模块
		this.pathResolver = new PathResolver();
		this.config = this.pathResolver.resolvePaths(serverUrl);

		this.openApiSpecFetcher = new OpenApiSpecFetcher();
		this.oazapftsGenerator = new OazapftsGenerator();
		this.functionAnalyzer = new FunctionAnalyzer();
		this.moduleResolver = new ModuleResolver();
		this.modularExportGenerator = new ModularExportGenerator();
		this.fileManager = new FileManager();
	}

	/**
	 * 生成 API 客户端
	 */
	async generate(): Promise<void> {
		console.log('🚀 开始生成零硬编码API客户端...');

		try {
			// 1. 动态获取 OpenAPI 规范
			await this.fetchOpenApiSpec();

			// 2. 使用 oazapfts 生成原始客户端
			await this.generateOazapftsClient();

			// 3. 分析函数并生成模块化重新导出
			await this.generateModularExports();

			// 4. 清理临时文件
			this.cleanupTempFile();

			console.log('✅ 零硬编码API客户端生成完成!');
			console.log(`📂 生成的文件:`);
			console.log(`  - ${this.config.clientPath}`);
			console.log(`  - ${this.config.adaptersPath}`);
			console.log('🎯 完全遵循Hono最佳实践，零硬编码，直接使用类型安全的原始函数');
		} catch (error) {
			// 确保在出错时也清理临时文件
			this.cleanupTempFile();
			throw error;
		}
	}

	/**
	 * 动态从服务器获取 OpenAPI 规范
	 */
	private async fetchOpenApiSpec(): Promise<void> {
		await this.openApiSpecFetcher.fetchSpec(this.config.serverUrl, this.config.tempOpenapiPath);
	}

	/**
	 * 使用 oazapfts 生成原始客户端
	 */
	private async generateOazapftsClient(): Promise<void> {
		// 确保输出目录存在
		this.fileManager.ensureDirectoryExists(this.config.outputDir);

		// 生成客户端
		await this.oazapftsGenerator.generateClient(this.config.tempOpenapiPath, this.config.clientPath);

		// 添加自定义配置和注释
		this.fileManager.addBasicConfiguration(this.config.clientPath, this.config.serverUrl);
	}

	/**
	 * 生成模块化重新导出
	 */
	private async generateModularExports(): Promise<void> {
		console.log('🔧 分析函数并生成模块化导出...');

		try {
			// 解析生成的客户端文件
			const functions = this.functionAnalyzer.analyzeFunctions(this.config.clientPath);

			// 按模块分组
			const modules = this.moduleResolver.groupByModule(functions);

			// 生成重新导出文件
			const exportContent = this.modularExportGenerator.generateExportContent(functions, modules);

			fs.writeFileSync(this.config.adaptersPath, exportContent, 'utf-8');

			console.log('✅ 模块化导出生成成功');
			console.log(`📊 共分析 ${functions.length} 个函数`);
			console.log(`🏗️ 按以下模块组织:`);
			Object.entries(modules).forEach(([module, funcs]) => {
				console.log(`  - ${module}: ${funcs.length} 个函数`);
			});
		} catch (error) {
			console.error('❌ 模块化导出生成失败:', error);
			throw error;
		}
	}

	/**
	 * 清理临时文件
	 */
	private cleanupTempFile(): void {
		this.fileManager.cleanupTempFile(this.config.tempOpenapiPath);
	}
}
