# API 客户端生成器

## 概述

这是一个零硬编码的 API 客户端生成器，遵循 Hono 框架的最佳实践。它能够动态从运行中的服务器获取 OpenAPI 规范，并生成类型安全的 TypeScript 客户端代码。

## 主要特性

- ✅ **动态获取**: 从运行中的服务器获取最新的 OpenAPI 规范
- ✅ **零硬编码**: 完全基于函数名模式动态分析，无需手动维护
- ✅ **类型安全**: 保持完整的 TypeScript 类型信息
- ✅ **模块化组织**: 基于函数名模式自动分组
- ✅ **向后兼容**: 支持现有的导入方式
- ✅ **临时处理**: 使用临时文件处理，不保存实体文件到项目目录

## 使用方法

### 基本使用

```bash
# 使用默认服务器 (http://localhost:8787)
bun run build:api

# 指定自定义服务器地址
bun run build:api http://localhost:3000
bun run build:api https://api.example.com

# 直接运行脚本
npx tsx scripts/generate-api-client.ts
npx tsx scripts/generate-api-client.ts http://localhost:3000
```

### 开发工作流

1. **启动服务器**:

   ```bash
   bun run dev:backend  # 启动后端服务器
   ```

2. **生成 API 客户端**:

   ```bash
   bun run build:api    # 从服务器获取规范并生成客户端
   ```

3. **使用生成的客户端**:

   ```typescript
   // 直接使用解包装函数（推荐）
   import { getHealth, adminGetUsers } from '@/generated/api-adapters.g';

   const health = await getHealth(); // 直接得到业务数据
   const users = await adminGetUsers(token);
   ```

## 生成的文件

- `frontend/src/generated/api-client.g.ts`: oazapfts 生成的原始客户端
- `frontend/src/generated/api-adapters.g.ts`: 模块化重新导出文件
- 临时文件: `.temp-openapi.json`（自动清理，不保存到项目目录）

## 错误处理

脚本具有智能的错误处理机制：

1. **服务器连接失败**: 显示详细的错误信息和解决方案
2. **生成失败**: 提供清晰的使用说明
3. **临时文件清理**: 确保在任何情况下都清理临时文件

## 配置选项

### 默认配置

- 默认服务器: `http://localhost:8787`
- 输出目录: `frontend/src/generated/`
- 临时文件: `.temp-openapi.json`（自动清理）

### 自定义配置

可以通过构造函数参数自定义服务器地址：

```typescript
import { ZeroHardcodeApiGenerator } from './scripts/generate-api-client';

const generator = new ZeroHardcodeApiGenerator('https://api.example.com');
await generator.generate();
```

## 技术栈

- **TypeScript**: 完整的类型支持
- **oazapfts**: OpenAPI 到 TypeScript 的代码生成
- **Node.js fetch**: 动态获取 OpenAPI 规范
- **Hono**: 轻量级 Web 框架最佳实践

## 最佳实践

1. **开发时**: 使用 `bun run dev:with-watch` 自动监听 API 变化
2. **部署前**: 运行 `bun run build:api` 确保客户端代码最新
3. **生产环境**: 使用具体的服务器地址生成客户端
4. **团队协作**: 将生成的客户端代码提交到版本控制

## 故障排除

### 常见问题

1. **服务器连接失败**

   - 确保服务器正在运行
   - 检查端口号是否正确
   - 验证防火墙设置

2. **类型错误**

   - 运行 `bun run type-check` 检查类型
   - 确保 TypeScript 版本兼容

3. **生成失败**
   - 检查 OpenAPI 规范是否有效
   - 验证 oazapfts 版本兼容性

### 调试模式

```bash
# 启用详细日志
DEBUG=* bun run build:api
```
