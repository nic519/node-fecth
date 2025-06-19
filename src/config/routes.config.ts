export const RoutesPathConfig = {
	// 直接从参数获取内容，目的是"生成"一个url方便与其他网站平台交换数据
	storage: '/storage',
	// KV存储操作（GET获取/POST存储）
	kv: '/kv',
	// 设置个人配置
	setting: '/setting',
	// 用户配置管理API
	userConfig: '/api/config/users',
	// 配置管理页面
	configPage: '/config',
	// 订阅路由，动态参数
	subscription: '/:uid',
} as const;

export type RouteKey = keyof typeof RoutesPathConfig;
