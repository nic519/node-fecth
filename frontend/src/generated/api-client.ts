// ===================================================================
// 🤖 完全动态生成的API客户端包装器 - 请勿手动修改
// 生成时间: 2025-07-17T17:27:15.063Z
// 基于: oazapfts (完全动态生成)
// ===================================================================

// 导入原始生成的客户端
import * as rawApi from './api-client-raw';

// 配置默认选项
const defaultOptions: rawApi.RequestOpts = {
	// 可以在这里设置全局默认配置
};

// 重新导出所有生成的API函数和类型
export * from './api-client-raw';

// 导出默认配置的 API 实例
export const api = {
	// 直接使用 rawApi 的所有方法，这样新增的接口会自动出现
	...rawApi,
	
	// 可以在这里添加一些便利方法
	configure: (options: Partial<rawApi.RequestOpts>) => {
		Object.assign(rawApi.defaults, options);
	},
	
	setBaseUrl: (baseUrl: string) => {
		rawApi.defaults.basePath = baseUrl;
	},
	
	setAuth: (token: string) => {
		rawApi.defaults.headers = {
			...rawApi.defaults.headers,
			Authorization: `Bearer ${token}`,
		};
	},
};

// 导出便利的分组API（可选，但保持动态性）
export const createApiGroups = () => {
	// 这里可以通过反射动态创建分组，但为了简单起见，暂时手动维护
	// 新的接口会通过 rawApi 自动暴露，也可以通过 api.* 访问
	
	return {
		// 所有方法都通过 api 暴露，支持动态添加
		health: {
			check: api.health || (() => { throw new Error('health endpoint not found'); }),
		},
		// 可以根据需要添加更多分组，但主要通过 api.* 使用
	};
};

// 默认导出配置好的 API 实例
export default api;

/*
使用示例：

import api from './api-client';

// 直接使用（推荐，支持新增接口自动生成）
const result = await api.getSomeEndpoint();

// 配置
api.setBaseUrl('https://api.example.com');
api.setAuth('your-token');

// 自定义配置
api.configure({
	headers: { 'Custom-Header': 'value' }
});

*/