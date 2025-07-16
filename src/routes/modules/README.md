# 模块化路由系统

本项目的路由处理已重构为模块化架构，提高了代码的可维护性和扩展性。

## 架构概述

```
src/routes/
├── middleware/           # 中间件管理
│   └── index.ts         # 中间件管理器
├── modules/             # 路由模块
│   ├── base/           # 基础接口和抽象类
│   ├── HealthModule.ts     # 健康检查模块
│   ├── UserModule.ts       # 用户管理模块
│   ├── AdminModule.ts      # 管理员功能模块
│   ├── StorageModule.ts    # 存储功能模块
│   ├── SubscriptionModule.ts # 订阅功能模块
│   ├── RouteRegistry.ts    # 路由注册器
│   └── index.ts           # 模块导出
├── handler/             # 原有处理器（向后兼容）
├── openapi/            # OpenAPI 定义
└── routesHandler.ts    # 重构后的主路由器
```

## 核心概念

### 1. 路由模块接口 (IRouteModule)

所有路由模块都必须实现此接口：

```typescript
interface IRouteModule {
	register(app: OpenAPIHono<{ Bindings: Env }>): void;
	readonly moduleName: string;
}
```

### 2. 基础路由模块 (BaseRouteModule)

提供通用功能的抽象基类，包含错误处理等工具方法。

### 3. 路由注册器 (RouteRegistry)

统一管理所有路由模块的注册和生命周期。

## 使用方法

### 创建新的路由模块

1. 继承 `BaseRouteModule`：

```typescript
import { BaseRouteModule } from '@/routes/modules/base/RouteModule';
import { OpenAPIHono } from '@hono/zod-openapi';

export class MyModule extends BaseRouteModule {
	readonly moduleName = 'MyModule';

	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		app.get('/my-route', (c) => {
			console.log(`✅ ${this.moduleName}: 处理请求`);
			return c.json({ message: 'Hello from my module!' });
		});
	}
}
```

2. 注册到路由注册器：

```typescript
// 在 RouteRegistry.ts 中添加
import { MyModule } from '@/routes/modules/MyModule';

private initializeModules(): void {
  this.modules = [
    // ... 现有模块
    new MyModule()
  ];
}
```

### 扩展现有功能

```typescript
import { Router } from '@/routes/routesHandler';
import { MyModule } from './MyModule';

const router = new Router();
const registry = router.getRouteRegistry();

// 动态添加模块
registry.addModule(new MyModule());
```

## 模块特性

### 健康检查模块 (HealthModule)

- 提供系统健康状态检查
- 路径：`/health`

### 用户模块 (UserModule)

- 用户配置管理
- 用户详情查询
- 路径：`/api/config/users/:uid`

### 管理员模块 (AdminModule)

- 用户创建、删除
- 用户列表管理
- 路径：`/create/user`, `/api/config/users/:uid` (DELETE)

### 存储模块 (StorageModule)

- 文件存储管理
- KV 存储服务
- 路径：`/storage`, `/kv`

### 订阅模块 (SubscriptionModule)

- 订阅内容管理
- Clash 配置生成
- 路径：`/:uid`

## 优势

1. **模块化**：每个功能模块独立，便于维护
2. **可扩展**：轻松添加新的路由模块
3. **类型安全**：完整的 TypeScript 支持
4. **错误处理**：统一的错误处理机制
5. **日志管理**：模块级别的日志标识
6. **文档集成**：自动生成 OpenAPI 文档

## 迁移指南

原有的路由处理逻辑已完全迁移到新的模块系统中，所有功能保持不变。如果需要修改特定功能，只需要：

1. 找到对应的模块文件
2. 在该模块中进行修改
3. 所有变更会自动反映到主应用中

这种架构确保了代码的清晰分离和高度可维护性。
