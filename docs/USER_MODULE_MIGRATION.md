# 用户模块 D1 数据库迁移指南

## 概述

用户模块已从 KV 存储迁移到 D1 数据库，提供更好的性能和查询能力。

## 🎯 完成的改造

### 1. 数据库层

#### ✅ 新增 users 表
- 文件：`src/db/schema.ts`
- 字段：
  - `id` (主键): 用户ID
  - `config` (JSON): 用户配置
  - `accessToken`: 访问令牌（索引字段）
  - `createdAt`: 创建时间
  - `updatedAt`: 更新时间

#### ✅ 生成数据库迁移
- 迁移文件：`drizzle/0001_furry_goblin_queen.sql`
- 状态：已生成，待应用

### 2. API 模块重构

#### ✅ 用户自己的操作 (api.user.ts)
- 保留身份验证逻辑
- 使用 D1 数据库存储
- 支持自动创建/更新（upsert）
- 路由：
  - `POST /api/user/update` - 更新配置
  - `GET /api/user/detail` - 获取配置

#### ✅ 管理员操作 (api.user-for-admin.ts)
- 使用 CRUD 工厂模式
- 完整的 CRUD 操作
- 路由：
  - `GET /api/admin/users` - 获取用户列表
  - `GET /api/admin/users/{uid}` - 获取用户详情
  - `POST /api/admin/users` - 创建用户
  - `PUT /api/admin/users/{uid}` - 更新用户
  - `DELETE /api/admin/users/{uid}` - 删除用户

### 3. Schema 定义

#### ✅ schema.user.ts
- 添加数据库模型 Schema (`ScUserModel`)
- 添加请求/响应 Schema
- 兼容旧的 KV 模式（`source: 'd1'`）

### 4. 路由注册

#### ✅ 更新的文件
- `src/routes/modules/index.ts` - 导出新模块
- `src/routes/modules/api-registry.ts` - 注册 userForAdmin 模块
- `src/routes/openapi/index.ts` - 导出路由定义
- `src/routes/modules/api.admin.ts` - 移除重复的用户路由

### 5. 文档

#### ✅ 创建的文档
- `src/routes/modules/user/README.md` - 用户模块使用文档
- `docs/USER_MODULE_MIGRATION.md` - 本迁移指南

## 📝 需要执行的操作

### 1. 应用数据库迁移

```bash
# 方式1: 使用 drizzle-kit push（推荐开发环境）
npx drizzle-kit push

# 确认并执行 SQL 语句
# 选择 "Yes, I want to execute all statements"
```

### 2. 更新 wrangler.toml

确保 D1 数据库绑定配置正确：

```toml
[[d1_databases]]
binding = "DB"
database_name = "your-database-name"
database_id = "your-database-id"
```

### 3. 注册新模块

在应用初始化时注册 `userForAdmin` 模块：

```typescript
// 预加载模块示例
await apiRegistry.preloadModules(app, [
  'health',
  'user',           // 用户自己的操作
  'userForAdmin',   // 管理员操作
  'adminTemplate',
  // ...其他模块
]);
```

### 4. 数据迁移（可选）

如果有现有的 KV 数据需要迁移：

```typescript
// 伪代码示例
async function migrateUsersFromKVToD1(env: Env) {
  const userManager = new UserManager(env);
  const crud = new BaseCRUD<User>(env, users);
  
  // 1. 从 KV 获取所有用户
  const kvUsers = await userManager.getAllUsers();
  
  // 2. 逐个迁移到 D1
  for (const kvUser of kvUsers) {
    await crud.insert({
      id: kvUser.uid,
      config: JSON.stringify(kvUser.config),
      accessToken: kvUser.config.accessToken,
    });
  }
}
```

## 🔄 API 变更说明

### 用户 API（无变化）
- 接口路径保持不变
- 请求/响应格式保持不变
- 身份验证方式保持不变

### 管理员 API（路径变更）

#### 旧路径 → 新路径

| 操作 | 旧路径 | 新路径 |
|------|--------|--------|
| 获取用户列表 | `GET /api/admin/users` | `GET /api/admin/users` ✅ |
| 创建用户 | `POST /api/admin/user/create` | `POST /api/admin/users` 🔄 |
| 删除用户 | `POST /api/admin/user/delete` | `DELETE /api/admin/users/{uid}` 🔄 |
| 获取用户详情 | ❌ 不存在 | `GET /api/admin/users/{uid}` ✨ |
| 更新用户 | ❌ 不存在 | `PUT /api/admin/users/{uid}` ✨ |

#### 请求格式变更

**创建用户**
```json
// 不变
POST /api/admin/users?superToken=xxx
{
  "uid": "user123",
  "config": { ... }
}
```

**删除用户**
```json
// 旧方式
POST /api/admin/user/delete?superToken=xxx
{ "uid": "user123" }

// 新方式
DELETE /api/admin/users/user123?superToken=xxx
```

## ⚠️ 注意事项

### 1. 向后兼容性
- 用户自己的 API 完全兼容
- 管理员 API 路径有变化，需要更新前端代码

### 2. 数据格式
- `config` 字段存储为 JSON 字符串
- API 自动处理序列化/反序列化
- 兼容旧的 meta.source 字段（新值为 `d1`）

### 3. 性能影响
- D1 查询比 KV 更快（索引支持）
- 支持复杂查询（如按 accessToken 查找）
- 事务支持更好

### 4. 中间件
- `api.admin.ts` 保留了超级管理员验证中间件
- 所有 `/api/admin/*` 路由自动验证 superToken

## 🧪 测试检查清单

### 用户操作
- [ ] 首次创建用户配置
- [ ] 更新现有用户配置
- [ ] 获取用户详情
- [ ] 身份验证失败场景

### 管理员操作
- [ ] 获取所有用户列表
- [ ] 获取单个用户详情
- [ ] 创建新用户
- [ ] 更新用户配置
- [ ] 删除用户
- [ ] 超级管理员令牌验证

### 错误处理
- [ ] 用户不存在
- [ ] 无效的 token
- [ ] 配置格式错误
- [ ] 数据库连接失败

## 📚 相关文档

- [用户模块 README](../src/routes/modules/user/README.md)
- [CRUD 工厂使用指南](../src/db/CRUD_FACTORY_USAGE.md)
- [数据库 Schema](../src/db/schema.ts)

## 🚀 部署步骤

### 1. 本地测试
```bash
# 1. 应用数据库迁移
npx drizzle-kit push

# 2. 启动开发服务器
npm run dev

# 3. 测试 API
curl http://localhost:8787/api/user/detail?uid=test&token=xxx
```

### 2. 生产部署
```bash
# 1. 部署到 Cloudflare Workers
wrangler deploy

# 2. 应用数据库迁移（生产环境）
wrangler d1 migrations apply your-database-name

# 3. 验证部署
curl https://your-domain.com/api/health
```

## 🔧 故障排查

### 问题：数据库表不存在
```
解决方案：运行 npx drizzle-kit push
```

### 问题：路由冲突
```
解决方案：确保 api.admin.ts 和 api.user-for-admin.ts 没有重复注册相同路由
```

### 问题：配置序列化错误
```
解决方案：检查 config 是否为有效的 JSON 对象
```

## 📞 支持

如有问题，请查看：
1. [用户模块 README](../src/routes/modules/user/README.md)
2. 项目日志输出
3. 数据库迁移文件

---

**迁移完成日期**: 2025-11-21
**迁移版本**: v2.0 (D1)

