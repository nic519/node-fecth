# 数据库管理指南

## 📚 架构设计

### 两套独立的数据库

```
开发环境:
  ├── local.db (Drizzle Studio 查看)  ← 稳定的本地文件
  └── .wrangler/.../*.sqlite (后端运行时) ← Wrangler 管理

生产环境:
  └── Cloudflare D1 (远程数据库)  ← 云端持久化
```

### 为什么分离？

- **Wrangler 运行时数据库**: 文件名由哈希生成，不稳定
- **local.db**: 文件名固定，专门给 Drizzle Studio 使用
- **完全隔离**: 避免开发工具互相干扰

---

## 🛠️ 日常开发流程

### 1. Schema 变更

```bash
# 1. 修改 src/db/schema.ts
# 2. 生成迁移文件
yarn db:generate

# 3. 应用到本地开发数据库
yarn db:push:local

# 4. 重启后端（Wrangler 会自动应用迁移）
yarn dev:backend
```

### 2. 查看数据

```bash
# 使用 Drizzle Studio（连接 local.db）
yarn db:studio

# 或直接查询
sqlite3 local.db "SELECT * FROM templates;"
```

### 3. 后端测试

```bash
# 后端自动使用 Wrangler 的运行时数据库
yarn dev:backend

# 测试 API
curl http://localhost:8787/api/admin/templates?superToken=123
```

---

## 📦 生产部署

### 1. 配置环境变量

创建 `.env` 文件：

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_DATABASE_ID=7b3a5b77-a944-42e8-a822-614840ff97f9
CLOUDFLARE_D1_TOKEN=your-api-token
```

### 2. 生成并部署迁移

```bash
# 生成迁移（如果有新的 schema 变更）
yarn db:generate

# 部署迁移到生产
NODE_ENV=production yarn db:migrate:remote

# 部署应用
yarn deploy
```

---

## ⚠️ 注意事项

### ❌ 不要这样做

- ❌ 不要直接编辑 `.wrangler/` 目录下的文件
- ❌ 不要期望 `local.db` 和 Wrangler 数据库自动同步
- ❌ 不要提交 `local.db` 到 Git

### ✅ 推荐做法

- ✅ Schema 变更后，先 `yarn db:push:local`，再重启后端
- ✅ 使用 Drizzle Studio 查看 `local.db`
- ✅ 使用 API 测试后端功能
- ✅ 生产部署前测试迁移

---

## 🔍 故障排查

### 问题：Drizzle Studio 看不到数据

**原因**: `local.db` 和后端数据库是独立的

**解决**:
```bash
# 如果需要同步数据（仅用于查看）
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite ".dump templates" | \
  grep "^INSERT" | sqlite3 local.db
```

### 问题：后端找不到表

**原因**: Wrangler 数据库未初始化

**解决**:
```bash
# 重启后端，Wrangler 会自动应用迁移
yarn dev:backend
```

### 问题：数据不一致

**原因**: 两个数据库本来就是独立的

**解决**: 这是正常的！
- `local.db`: 给你看数据结构和测试数据
- Wrangler DB: 给后端运行时使用
- 生产 D1: 真实用户数据

---

## 📝 数据库文件说明

| 文件 | 用途 | 持久化 | Git |
|------|------|--------|-----|
| `local.db` | Drizzle Studio 查看 | 本地 | ❌ 忽略 |
| `.wrangler/**/*.sqlite` | 后端运行时 | 临时 | ❌ 忽略 |
| `drizzle/*.sql` | 迁移脚本 | 版本控制 | ✅ 提交 |
| Cloudflare D1 | 生产数据库 | 云端 | - |

---

## 🎯 最佳实践总结

1. **开发**: 使用 `local.db` + Drizzle Studio 查看数据
2. **测试**: 使用后端 API 测试功能
3. **部署**: 迁移自动应用到生产 D1
4. **隔离**: 不同环境的数据库完全独立

**这样可以避免数据库路径不稳定带来的所有问题！** ✅

