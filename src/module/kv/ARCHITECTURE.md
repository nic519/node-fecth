# 系统架构文档

## 重构后的架构概览

### 架构图
```
┌─────────────────────────────────────────────────────────────┐
│                      HTTP 请求层                             │
├─────────────────────────────────────────────────────────────┤
│  KvHandler (路由处理器)                                       │
│  ├─ 处理 HTTP 请求响应                                       │
│  ├─ 参数验证和错误处理                                       │
│  └─ 调用业务逻辑服务                                         │
├─────────────────────────────────────────────────────────────┤
│                     业务逻辑层                               │
├─────────────────────────────────────────────────────────────┤
│  KvService (KV业务逻辑)                                      │
│  ├─ 环境检测和智能路由                                       │
│  ├─ KV操作封装 (get/put/delete)                             │
│  └─ 本地/生产环境适配                                        │
├─────────────────────────────────────────────────────────────┤
│                     基础设施层                               │
├─────────────────────────────────────────────────────────────┤
│  ForwardingService (转发服务)                                │
│  ├─ 通用请求转发                                            │
│  ├─ GET/POST 方法支持                                       │
│  └─ 错误处理和重试                                          │
├─────────────────────────────────────────────────────────────┤
│  CommonUtils (工具类)                                        │
│  ├─ 环境检测                                                │
│  └─ 配置管理                                                │
└─────────────────────────────────────────────────────────────┘
```

## 核心服务说明

### 1. KvHandler (HTTP处理器)
**职责**: HTTP请求响应处理
- ✅ 路由请求处理
- ✅ 参数验证
- ✅ 错误响应生成
- ✅ 环境检测和转发

**接口**:
- `GET /kv?key=xxx` - 获取KV值
- `POST /kv` - 设置/删除KV值

### 2. KvService (业务逻辑服务)
**职责**: KV操作业务逻辑
- ✅ 智能环境路由
- ✅ KV操作封装
- ✅ 统一错误处理
- ✅ 环境信息查询

**方法**:
```typescript
get(key, uid?, token?) -> Promise<string | null>
put(key, value, uid?, token?) -> Promise<void>
delete(key, uid?, token?) -> Promise<void>
getEnvironmentInfo() -> EnvironmentInfo
```

### 3. ForwardingService (转发服务)
**职责**: 通用请求转发
- ✅ HTTP请求转发
- ✅ 参数处理
- ✅ 响应处理
- ✅ 错误重试

**方法**:
```typescript
forwardRequest(request, targetPath) -> Promise<Response>
forwardGet(targetPath, params) -> Promise<string | null>
forwardPost(targetPath, data) -> Promise<void>
```

## 架构优势

### 1. 职责分离 (Separation of Concerns)
- **HTTP层**: 专注请求响应处理
- **业务层**: 专注业务逻辑
- **基础层**: 专注通用功能

### 2. 代码复用 (Code Reusability)
- 转发逻辑可被多个服务复用
- KV操作逻辑统一管理
- 工具函数集中维护

### 3. 易于测试 (Testability)
- 每层都有明确的接口
- 依赖注入支持Mock
- 单元测试更容易编写

### 4. 易于扩展 (Extensibility)
- 新增存储类型只需添加对应Service
- 新增转发目标只需配置
- 新增HTTP端点只需添加Handler

### 5. 环境适配 (Environment Adaptation)
- 自动检测运行环境
- 开发环境自动转发到生产
- 生产环境直接使用本地KV

## 环境处理策略

### 本地开发环境
```
Request → KvHandler → ForwardingService → 生产环境Worker
```

### 生产环境
```
Request → KvHandler → KvService → 本地KV Binding
```

## 配置管理

### 开发配置 (`src/config/dev-config.ts`)
```typescript
{
  productionWorkerUrl: 'https://your-worker.workers.dev',
  enableForwarding: true
}
```

### 环境检测逻辑
```typescript
CommonUtils.isLocalEnv(request) → 检查请求来源是否为本地
```

## 迁移指南

### 从旧架构迁移
1. **替换 KvProxy**:
   ```typescript
   // 旧: import { KvProxy } from '@/utils/kvProxy'
   import { KvService } from '@/services/kvService'
   ```
 

2. **方法调用保持不变**:
   ```typescript
   await kvService.get(key)
   await kvService.put(key, value)
   ```

## 最佳实践

### 1. 服务使用
- 优先使用 `KvService` 而不是 `KvProxy`
- 在Handler层处理HTTP相关逻辑
- 在Service层处理业务逻辑

### 2. 错误处理
- Handler层返回适当的HTTP状态码
- Service层抛出具体的业务异常
- 使用统一的日志格式

### 3. 性能优化
- 生产环境避免不必要的转发
- 合理使用缓存机制
- 监控转发请求的性能

### 4. 安全考虑
- 验证转发请求的来源
- 过滤敏感信息
- 使用HTTPS进行转发

## 未来扩展计划

1. **添加缓存层**: 减少对生产环境的请求频率
2. **支持批量操作**: 提高KV操作的效率
3. **添加监控**: 收集性能和错误指标
4. **支持多环境**: 支持staging、testing等环境 