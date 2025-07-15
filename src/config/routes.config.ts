export const RoutesPathConfig = {
	// === API接口 (以 /api 开头) ===
	// 存储内容API
	storage: '/api/storage',
	// KV存储操作API（GET获取/POST存储）
	kv: '/api/kv',
	// 用户配置管理API
	userConfig: '/api/config/users',
	// 创建用户API (PUT方法)
	createUser: '/api/create/user',
	
	// === 页面路由 (不以 /api 开头) ===
	// 设置个人配置页面
	setting: '/setting',
	// 配置管理页面
	configPage: '/config',
	// 订阅路由，动态参数
	subscription: '/:uid',
} as const;

export type RouteKey = keyof typeof RoutesPathConfig;
