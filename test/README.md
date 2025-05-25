# 测试指南

本项目提供了多种测试方法，让你可以在不启动完整wrangler dev服务器的情况下快速测试路由功能。

## 🚀 快速测试方法

### 1. 快速测试脚本（推荐）
最简单的测试方法，无需安装额外依赖：

```bash
npm run test
# 或者直接运行
node test/quick-test.js
```

**特点：**
- ✅ 无需编译TypeScript
- ✅ 无需安装额外依赖
- ✅ 快速验证路由逻辑
- ✅ 模拟真实的请求/响应

### 2. TypeScript测试脚本
使用ts-node直接运行TypeScript测试：

```bash
npm run test:ts
# 或者直接运行
npx ts-node test/simple-test.ts
```

**特点：**
- ✅ 直接测试TypeScript代码
- ✅ 类型安全
- ⚠️ 需要安装ts-node

### 3. Jest测试套件
完整的单元测试框架：

```bash
npm install  # 安装测试依赖
npm run test:jest
```

**特点：**
- ✅ 专业的测试框架
- ✅ 详细的测试报告
- ✅ 支持测试覆盖率
- ⚠️ 需要安装Jest相关依赖

## 📋 测试覆盖的功能

所有测试方法都会验证以下功能：

### 存储路由 `/storage`
- ✅ 正常返回URL参数内容
- ✅ 缺少参数时返回400错误

### KV路由 `/kv`
- ✅ 有效请求返回KV值
- ✅ 无效token返回401错误
- ✅ 不存在的key返回404错误
- ✅ 缺少参数返回400错误

### 订阅路由 `/:uid`
- ✅ 有效token返回订阅内容
- ✅ 无效token返回401错误

### 404路由
- ✅ 不存在的路由返回404错误

## 🔧 测试数据

测试使用以下模拟数据：

**用户配置：**
```javascript
{
    "519": { "ACCESS_TOKEN": "d2f1441a2f96" },
    "yj": { "ACCESS_TOKEN": "luh144olj60" }
}
```

**KV数据：**
```javascript
{
    "test-key": "test-value",
    "config": "{\"setting\": \"value\"}",
    "user-data": "some user data"
}
```

## 📝 测试示例

### 测试KV路由
```bash
# 有效请求
curl "http://localhost:8787/kv?key=test-key&token=d2f1441a2f96&uid=519"
# 预期：返回 "test-value"

# 无效token
curl "http://localhost:8787/kv?key=test-key&token=invalid&uid=519"
# 预期：返回 401 Unauthorized
```

### 测试存储路由
```bash
# 正常请求
curl "http://localhost:8787/storage?v=hello%20world"
# 预期：返回 "hello world"

# 缺少参数
curl "http://localhost:8787/storage"
# 预期：返回 400 Bad Request
```

## 🎯 推荐工作流程

1. **开发时**：使用 `npm run test` 快速验证逻辑
2. **调试时**：使用 `npm run dev` 启动完整服务器
3. **部署前**：运行完整测试套件确保质量

## 🔍 调试技巧

如果测试失败，可以：

1. 检查控制台输出的详细错误信息
2. 修改测试脚本中的URL或参数
3. 添加更多console.log来调试
4. 使用wrangler dev进行实际环境测试

这样你就可以在开发过程中快速验证代码功能，而不需要每次都启动完整的开发服务器！ 