/**
 * ===================================================================
 * 📦 模块化导出生成器
 * ===================================================================
 */

import type { FunctionInfo, IModularExportGenerator, ModuleGroups } from '../core/types';

/**
 * 模块化导出生成器实现
 * 负责生成模块化重新导出文件的内容
 */
export class ModularExportGenerator implements IModularExportGenerator {
	/**
	 * 生成导出内容
	 */
	generateExportContent(functions: FunctionInfo[], modules: ModuleGroups): string {
		// 生成解包装的函数导出
		const wrappedFunctions = functions
			.map((f) => {
				return `// 解包装的 ${f.name} 函数
export const ${f.name} = async (...args: Parameters<typeof _${f.name}>) => {
  const response = await _${f.name}(...args);
  return response.data;
};`;
			})
			.join('\n\n');

		// 生成导入语句
		const importNames = functions.map((f) => `${f.name} as _${f.name}`).join(',\n  ');

		// 生成模块对象
		const moduleExports = Object.entries(modules)
			.map(([moduleName, funcs]) => {
				const functionList = funcs.map((f) => f.name).join(',\n    ');
				return `  // ${moduleName} 模块 (${funcs.length} 个函数)
  ${moduleName}: {
    ${functionList}
  }`;
			})
			.join(',\n\n');

		// 生成向后兼容的导出
		const compatibilityExports = Object.keys(modules)
			.map((moduleName) => `export const ${moduleName}Api = modules.${moduleName};`)
			.join('\n');

		return `// ===================================================================
// 🚀 零硬编码 API 模块化导出 (Hono 最佳实践)
// ===================================================================
//
// 此文件基于函数名模式自动生成模块化导出，零硬编码
//
// 🎯 特点：
// - 自动解包装响应，直接返回业务层数据
// - 基于函数名模式自动分组，无硬编码逻辑
// - 支持直接导入和模块化导入两种方式
// - 完全遵循 Hono 轻量级设计理念
//
// ⚠️ 此文件自动生成，请勿手动编辑
//
// 🔄 不要更新此文件，请运行：yarn build:api
//
// ===================================================================

// 导入原始函数（带下划线前缀）
import {
  ${importNames}
} from './api-client.g';

${wrappedFunctions}

// 模块化组织（可选使用）
export const modules = {
${moduleExports}
};

// 向后兼容的导出
${compatibilityExports}

// 默认导出模块集合
export default modules;

// ===================================================================
// 使用示例
// ===================================================================
//
// 方式1：直接使用解包装函数（推荐，直接得到业务数据）
// import { getHealth, adminGetUsers } from '@/generated/api-adapters.g';
// const health = await getHealth(); // 直接得到 { code: 0, msg: "", data: {...} }
// const users = await adminGetUsers(token); // 直接得到 { code: 0, msg: "", data: { users: [...], count: 10, timestamp: "..." } }
//
// 方式2：使用模块化接口
// import { modules } from '@/generated/api-adapters.g';
// const health = await modules.health.getHealth();
// const users = await modules.admin.adminGetUsers(token);
//
// 方式3：向后兼容
// import { adminApi } from '@/generated/api-adapters.g';
// const users = await adminApi.adminGetUsers(token);
//
// 方式4：直接使用原始客户端（如果需要）
// import { getHealth, defaults } from '@/generated/api-client.g';
// const result = await getHealth(); // 得到 { status: 200, data: { code: 0, msg: "", data: {...} } }
//
// ===================================================================
`;
	}
}
