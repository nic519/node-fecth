/**
 * ===================================================================
 * 🔍 函数分析器
 * ===================================================================
 */

import * as fs from 'fs';
import type { FunctionInfo, IFunctionAnalyzer } from '../core/types';
import { ModuleResolver } from './ModuleResolver';

/**
 * 函数分析器实现
 * 负责分析客户端文件中的函数
 */
export class FunctionAnalyzer implements IFunctionAnalyzer {
	private moduleResolver: ModuleResolver;

	constructor() {
		this.moduleResolver = new ModuleResolver();
	}

	/**
	 * 分析客户端文件中的函数
	 */
	analyzeFunctions(clientPath: string): FunctionInfo[] {
		const content = fs.readFileSync(clientPath, 'utf-8');
		const functions: FunctionInfo[] = [];

		// 匹配函数声明和其文档注释
		const functionRegex = /(?:\/\*\*\s*\n\s*\*\s*(.*?)\s*\n\s*\*\/\s*\n)?export function (\w+)\(/gs;
		let match;

		while ((match = functionRegex.exec(content)) !== null) {
			const [, description = '', functionName] = match;

			// 基于函数名模式确定模块
			const module = this.moduleResolver.resolveModule(functionName);

			functions.push({
				name: functionName,
				description: description.trim(),
				module,
			});
		}

		return functions;
	}
}
