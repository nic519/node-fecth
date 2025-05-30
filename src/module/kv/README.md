# 服务层架构文档

## 概述

重构后的架构采用了更清晰的分层设计：

- **ForwardingService** - 通用请求转发服务
- **KvService** - KV存储业务逻辑服务
- **KvHandler** - HTTP路由处理器

## 服务类说明

### ForwardingService

通用的请求转发服务，负责在本地开发环境中将请求转发到生产环境。

```typescript
import { ForwardingService } from '@/services/forwardingService';

// 转发完整的HTTP请求
const response = await ForwardingService.forwardRequest(request, '/api/kv');

// 发送GET请求
const result = await ForwardingService.forwardGet('/api/data', { key: 'value' });

// 发送POST请求
await ForwardingService.forwardPost('/api/update', { key: 'value' });
```

### KvService

核心KV业务逻辑服务，自动处理本地和生产环境的差异。

```typescript
import { KvService } from '@/services/kvService';

// 创建服务实例
const kvService = new KvService(request, env);

// KV操作
await kvService.put('mykey', 'myvalue');
const value = await kvService.get('mykey');
await kvService.delete('mykey');

// 环境信息
const envInfo = kvService.getEnvironmentInfo();
console.log('环境信息:', envInfo);
```

### KvHandler

HTTP路由处理器，专注于请求响应处理：

```typescript
// 自动处理GET和POST请求
// GET /kv?key=mykey - 获取值
// POST /kv { "key": "mykey", "value": "myvalue" } - 设置值
// POST /kv { "key": "mykey", "action": "delete" } - 删除值
```

## 架构优势

### 1. 职责分离
- **ForwardingService**: 专注转发逻辑
- **KvService**: 专注业务逻辑
- **KvHandler**: 专注HTTP处理

### 2. 代码复用
- 转发逻辑统一抽取，可被其他服务复用
- KV操作逻辑集中管理

### 3. 易于测试
- 每个服务都有明确的职责
- 可以独立进行单元测试

### 4. 易于扩展
- 新增其他存储类型只需创建对应的Service
- 新增转发目标只需配置ForwardingService

## 迁移指南

### 从 KvProxy 迁移到 KvService

 
**新代码：**
```typescript
import { KvService } from '@/services/kvService';

const kvService = new KvService(request, env);
await kvService.put('key', 'value');
const value = await kvService.get('key');
```

### 从自定义转发逻辑迁移到 ForwardingService

**旧代码：**
```typescript
// 自定义转发逻辑
const forwardUrl = new URL('/api', CommonUtils.getProdURI());
const response = await fetch(forwardUrl.toString(), {
  method: 'POST',
  headers: { /* ... */ },
  body: JSON.stringify(data)
});
```

**新代码：**
```typescript
import { ForwardingService } from '@/services/forwardingService';

// 使用统一的转发服务
const response = await ForwardingService.forwardRequest(request, '/api');
// 或
await ForwardingService.forwardPost('/api', data);
```

## 配置要求

确保 `src/config/dev-config.ts` 中正确配置了生产环境URL：

```typescript
const DEFAULT_DEV_CONFIG: DevConfig = {
    productionWorkerUrl: 'https://your-production-worker.workers.dev',
    enableForwarding: true
};
```

## 注意事项
 
2. **环境检测**: 服务会自动检测运行环境并选择合适的处理方式
3. **错误处理**: 所有服务都包含完整的错误处理和日志记录
4. **性能**: 生产环境直接使用KV binding，无额外开销

## 最佳实践

1. **优先使用新服务**: 新代码应使用 `KvService` 而不是 `KvProxy`
2. **统一错误处理**: 在Handler层处理错误并返回适当的HTTP状态码
3. **日志记录**: 利用服务层的内置日志记录功能
4. **环境隔离**: 通过配置管理不同环境的行为 