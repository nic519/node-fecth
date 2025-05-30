export const RoutesPath = {
	// 直接从参数获取内容，目的是"生成"一个url方便与其他网站平台交换数据
	storage: '/storage',
	// KV存储操作（GET获取/POST存储）
	kv: '/kv',
	// 订阅路由，动态参数
	subscription: '/:uid',
	// 订阅路由，1URL
	subscriptionFast: '/quick',
} as const;

export type RouteKey = keyof typeof RoutesPath;
