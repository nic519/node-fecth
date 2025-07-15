export const RoutesPathConfig = {
	// === API接口 ===
	// 存储内容API (Pages部署时需要 /api 前缀)
	storage: '/storage',
	// KV存储操作API（GET获取/POST存储）
	kv: '/kv',
	// 用户配置管理API
	userConfig: '/config/users',
	// 创建用户API (PUT方法) - Worker部署可以不要/api前缀
	createUser: '/create/user',
	
	// === 页面路由 ===
	// 设置个人配置页面
	setting: '/setting',
	// 配置管理页面
	configPage: '/config',
	// 订阅路由，动态参数
	subscription: '/:uid',
} as const;

export type RouteKey = keyof typeof RoutesPathConfig;
