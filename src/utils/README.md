# KV代理服务使用说明

## 概述

`KvProxy` 是一个智能的KV存储代理服务，能够自动检测运行环境：
- **生产环境**: 直接使用Cloudflare Workers的KV存储
- **本地开发环境**: 自动转发KV操作到生产环境的Worker

## 使用方法

### 1. 基本用法

```typescript
import { KvProxy } from '../utils/kvProxy';

// 在你的类中初始化
export class YourClass {
    private kvProxy: KvProxy;
    
    constructor(private env: Env) {
        this.kvProxy = new KvProxy(env);
    }
    
    async someMethod() {
        // KV存储操作
        await this.kvProxy.put('mykey', 'myvalue');
        
        // KV读取操作
        const value = await this.kvProxy.get('mykey');
        console.log(value); // 输出: myvalue
    }
}
```

### 2. 替换现有的KV操作

**之前的代码:**
```typescript
// 直接使用KV（在本地开发环境不工作）
this.env.KV_BINDING.put(storageKey, clashNodes);
const value = await this.env.KV_BINDING.get(key);
```

**修改后的代码:**
```typescript
// 使用KV代理（自动处理本地开发环境）
await this.kvProxy.put(storageKey, clashNodes);
const value = await this.kvProxy.get(key);
```

### 3. 配置生产环境URL

在 `src/config/dev-config.ts` 中配置你的生产Worker URL：

```typescript
const DEFAULT_DEV_CONFIG: DevConfig = {
    // 替换为你的实际生产worker域名
    productionWorkerUrl: 'https://your-worker.your-domain.workers.dev',
    enableForwarding: true
};
```

## 工作原理

### 本地开发环境检测
代理服务通过检查 `env.KV_BINDING` 是否可用来判断是否为本地开发环境。

### 转发机制
- **GET操作**: 转发到 `/kv` 端点（GET方法）
- **PUT操作**: 转发到 `/kv` 端点（POST方法）

### 生产环境路由
确保你的生产Worker包含统一的KV路由：
- `GET /kv` - 处理KV读取请求
- `POST /kv` - 处理KV写入请求

## 日志输出

代理服务会输出详细的日志信息，帮助调试：

```
🔍 环境检测: { hasKvBinding: false, kvGetAvailable: false, isLocalDev: true }
🔄 本地开发环境 - 转发KV GET操作: mykey
🌐 转发GET请求到: https://your-worker.workers.dev/kv?key=mykey
📥 KV GET成功: mykey - value content...

🔄 本地开发环境 - 转发KV PUT操作: mykey
🌐 转发PUT请求到: https://your-worker.workers.dev/kv
📤 KV PUT成功: mykey
```

## 错误处理

代理服务包含完整的错误处理机制：
- 配置检查
- 网络错误处理
- 响应状态验证
- 详细的错误日志

## 注意事项

1. 确保生产环境的Worker已部署并可访问
2. 正确配置 `productionWorkerUrl` 和 `enableForwarding`
3. 生产环境需要支持统一的 `/kv` 路由（GET和POST方法）
4. 本地开发时确保网络连接正常 