# 路由系统架构

## 概述

这个项目使用模块化的路由系统，每个路由都有独立的处理器，便于维护和扩展。

## 路由结构

```
src/routes/
├── types.ts              # 路由接口定义
├── routesConfig.ts       # 路由配置
├── router.ts             # 主路由器
├── storageHandler.ts     # 存储路由处理器
├── kvHandler.ts          # KV路由处理器
├── subscriptionHandler.ts # 订阅路由处理器
├── index.ts              # 模块导出
└── README.md             # 说明文档
```

## 可用路由

### 1. 存储路由 `/storage`
- **用途**: 返回URL参数中的内容
- **使用方式**: `GET /storage?v=content`
- **响应**: 返回参数`v`的值

### 2. KV路由 `/kv`
- **用途**: 获取KV存储中的值
- **使用方式**: `GET /kv?key=mykey&token=your_token&uid=user123`
- **参数**:
  - `key`: KV存储的键名
  - `token`: 用户访问令牌
  - `uid`: 用户ID
- **响应**: 返回KV存储中对应键的值

### 3. 订阅路由 `/:uid`
- **用途**: 处理订阅配置请求
- **使用方式**: `GET /user123?token=xxx&target=clash`
- **参数**:
  - `uid`: 用户ID（路径参数）
  - `token`: 用户访问令牌
  - `target`: 目标格式（clash/其他，默认clash）
- **响应**: 返回处理后的订阅配置文件

## 架构优势

1. **模块化**: 每个路由都有独立的处理器
2. **可扩展**: 添加新路由只需创建新的处理器并在router.ts中注册
3. **类型安全**: 使用TypeScript接口确保类型安全
4. **统一错误处理**: 在路由器层面统一处理404等错误
5. **清晰的职责分离**: 每个处理器只负责自己的业务逻辑

## 添加新路由

1. 在`routesConfig.ts`中添加新路由配置
2. 创建新的处理器类，实现`RouteHandler`接口
3. 在`router.ts`中注册新的处理器
4. 在`index.ts`中导出新的处理器（可选）

## 示例：添加新路由

```typescript
// 1. 在routesConfig.ts中添加
export const Routes = {
    // ... 现有路由
    newRoute: '/new-route',
} as const;

// 2. 创建处理器
export class NewRouteHandler implements RouteHandler {
    async handle(request: Request, env: Env): Promise<Response | null> {
        // 处理逻辑
        return new Response('Hello from new route!');
    }
}

// 3. 在router.ts中注册
private registerHandlers() {
    // ... 现有注册
    this.handlers.set(Routes.newRoute, new NewRouteHandler());
}
``` 