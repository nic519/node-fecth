export const Routes = {
    // 直接从参数获取内容，目的是“生成"一个url方便与其他网站平台交换数据
    storage: '/storage', 
    // 从kv里面获取内容
    kv: '/kv', 
    // 订阅路由，动态参数
    subscription: '/:uid', 
} as const;

export type RouteKey = keyof typeof Routes;