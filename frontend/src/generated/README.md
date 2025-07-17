# 🚀 自动化 API 同步工作流程

## 📋 概述

这个项目现在采用完全自动化的 API 客户端和适配器生成机制，确保前端代码始终与后端 API 规范保持同步。

## 🔄 工作流程

### 1. 当 API 规范变更时

当后端 OpenAPI 规范发生变化时（新增接口、修改接口、删除接口），只需要运行一个命令：

```bash
# 在项目根目录下运行
yarn generate-api
```

或者直接运行：

```bash
npx tsx scripts/generate-api-client.ts
```

### 2. 自动生成的文件

运行生成脚本后，会自动生成以下文件：

- `📄 api-client.ts` - 基于 OpenAPI 规范动态生成的原始客户端
- `🔧 api-adapters.ts` - 自动生成的适配器层，提供统一的API接口
- `📊 openapi.json` - OpenAPI 规范文档副本

⚠️ **重要：这些文件都是自动生成的，请勿手动编辑！**

### 3. 前端代码使用方式

前端代码始终使用适配器，不直接使用原始客户端：

```typescript
// ✅ 正确方式：使用适配器
import { adminApi, userConfigApi } from '@/generated/api-adapters';

// 管理员功能
const users = await adminApi.getAllUsers(superToken);
const result = await adminApi.deleteUser(uid, superToken);
await adminApi.createUser(uid, config, superToken);
const stats = await adminApi.getStats(superToken);

// 用户配置功能
const userDetail = await userConfigApi.getDetail(uid, token);
await userConfigApi.update(uid, newConfig, token);
```

```typescript
// ❌ 错误方式：直接使用原始客户端
import { getAdminUserAll } from '@/generated/api-client'; // 不要这样做
```

## 🛠️ 生成流程详解

### 第一步：获取 OpenAPI 规范
- 优先从运行中的后端 API (`/openapi.json`) 获取最新规范
- 如果后端不可用，回退到本地生成

### 第二步：生成原始客户端
- 使用 `oazapfts` 工具基于 OpenAPI 规范生成 TypeScript 客户端
- 自动包含所有路由、参数、响应类型

### 第三步：自动生成适配器
- 分析生成的客户端函数
- 按功能分类（管理员、用户配置、健康检查等）
- 生成统一的适配器接口
- 处理响应统一化和错误处理

### 第四步：修复生成代码问题
- 自动修复类型错误
- 修复未使用参数问题
- 确保代码可以通过 TypeScript 检查

## 🎯 优势

### ✅ 完全自动化
- 新增接口自动包含，无需手动编写
- API 变更自动同步，无需手动维护
- 类型安全，自动生成完整的 TypeScript 类型

### ✅ 统一接口
- 适配器提供统一的调用方式
- 屏蔽底层 API 差异
- 统一的错误处理和响应格式

### ✅ 零维护成本
- 不需要手动编写或维护任何 API 方法
- 不需要担心前后端不同步问题
- 新人可以立即使用，无需学习特定的 API 调用方式

## 🔍 故障排除

### 类型错误
如果出现类型错误，请：
1. 确保后端 OpenAPI 规范是最新的
2. 重新运行生成脚本：`yarn generate-api`
3. 检查是否有手动修改自动生成的文件

### API 方法缺失
如果某个 API 方法在适配器中找不到：
1. 检查后端是否正确注册了该接口
2. 确保 OpenAPI 规范包含该接口
3. 重新运行生成脚本

### 参数不匹配
如果 API 参数不匹配：
1. 检查后端接口定义是否有变更
2. 确保使用的是最新生成的适配器
3. 参考生成的类型定义调整调用方式

## 🚀 最佳实践

### 开发流程
1. 后端开发者修改或新增 API 接口
2. 前端开发者运行 `yarn generate-api`
3. 检查类型错误，调整前端代码（如需要）
4. 完成开发

### 版本控制
- 提交自动生成的文件到版本控制
- 在 CI/CD 中可以运行生成脚本验证同步状态
- 团队成员拉取代码后运行生成脚本确保最新状态

### 代码审查
- 重点审查前端业务逻辑代码
- 自动生成的文件可以跳过详细审查
- 关注适配器的使用方式是否正确

---

💡 **提示：** 这套工作流程确保了前后端 API 的完全同步，大大减少了因 API 变更导致的错误和维护成本。 