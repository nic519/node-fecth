export const Routes = {
    storage: '/storage',
    kv: '/kv',
    subscription: '/:uid', // 订阅路由，动态参数
} as const;

export type RouteKey = keyof typeof Routes;