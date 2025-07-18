/**
 * ===================================================================
 * 🏗️ 模块解析器
 * ===================================================================
 */

import type { FunctionInfo, IModuleResolver, ModuleGroups } from '../core/types';

/**
 * 模块解析器实现
 * 负责基于函数名模式确定模块分组（零硬编码）
 */
export class ModuleResolver implements IModuleResolver {
	/**
	 * 基于函数名模式确定模块（零硬编码）
	 */
	resolveModule(functionName: string): string {
		const name = functionName.toLowerCase();

		// 使用正则表达式模式匹配，而不是硬编码字符串
		const patterns = [
			{ pattern: /health/, module: 'health' },
			{ pattern: /admin/, module: 'admin' },
			{ pattern: /(config.*user|user.*config)/, module: 'userConfig' },
			{ pattern: /(storage|kv)/, module: 'storage' },
			{ pattern: /.*uid.*(?!admin)(?!config)/, module: 'subscription' },
		];

		for (const { pattern, module } of patterns) {
			if (pattern.test(name)) {
				return module;
			}
		}

		return 'general';
	}

	/**
	 * 按模块分组函数
	 */
	groupByModule(functions: FunctionInfo[]): ModuleGroups {
		const modules: ModuleGroups = {};

		functions.forEach((func) => {
			if (!modules[func.module]) {
				modules[func.module] = [];
			}
			modules[func.module].push(func);
		});

		return modules;
	}
}
