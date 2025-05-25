export const Routes = {
    // 直接从参数获取内容，目的是"生成"一个url方便与其他网站平台交换数据
    storage: '/storage', 
    // 从kv里面获取内容
    kv: '/kv', 
    // 向kv存储内容
    kvPut: '/kv-put',
    // 订阅路由，动态参数
    subscription: '/:uid', 
    // 订阅路由，1URL
    subscription1URL: '/quick',
} as const;

export type RouteKey = keyof typeof Routes;