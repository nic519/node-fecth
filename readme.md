# Cloudflare Pages 部署指南

## 架构说明

本项目采用 **Cloudflare Pages + Functions** 的架构：

- 🎨 **前端**: Preact + Vite，构建为静态资源
- ⚡ **后端**: Pages Functions 处理 `/api/*` 路由，复用 Workers 代码
- 🗄️ **存储**: Cloudflare KV (用户配置、统计数据)

## 开发模式

### 1. 启动完整开发环境

```bash
bun dev
```

这会同时启动：

- 前端开发服务器 (http://localhost:3000) - 使用 Vite
- 后端开发服务器 (http://localhost:8787) - 使用 Workers (仅用于开发)

### 2. 分别启动

```bash
# 仅启动后端
bun run dev:backend

# 仅启动前端
bun run dev:frontend
```

## 部署流程

### 方式一：自动化部署 (推荐)

1. **安装依赖**

```bash
bun install
```

2. **构建并部署到 Pages**

```bash
bun run deploy
```

### 方式二：通过 Cloudflare Dashboard

1. **构建前端**

```bash
bun run build:frontend
```

2. **创建 Pages 项目**

   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
   - 进入 Pages 页面
   - 选择 "上传资源" 或连接 Git 仓库
   - 上传 `frontend/dist` 目录

3. **配置 Functions**
   - 确保 `functions/` 目录包含在部署中
   - 配置 KV 绑定和环境变量

### 方式三：Git 自动部署

在 Cloudflare Pages 中连接 Git 仓库，配置：

**构建配置:**

```
构建命令: bun run build:frontend
构建输出目录: frontend/dist
```

**环境变量:**

```
SUPER_ADMIN_TOKEN=your-secret-token
```

## 环境配置

### KV 命名空间

在 Cloudflare Dashboard 中创建 KV 命名空间，并更新配置：

```toml
# wrangler.pages.toml
[[kv_namespaces]]
binding = "KV_BINDING"
id = "your-kv-namespace-id"

[[kv_namespaces]]
binding = "USERS_KV"
id = "your-users-kv-namespace-id"
```

### 环境变量

通过 Cloudflare Dashboard 或 CLI 设置：

```bash
wrangler pages secret put SUPER_ADMIN_TOKEN
``` 

在开发阶段
需要设置环境变量，则在项目根目录的 .dev.vars 设置，如:
SUPER_ADMIN_TOKEN="xxx"

## 故障排除

### 常见问题

1. **API 请求 404**

   - 检查 `functions/api/[[path]].ts` 文件是否存在
   - 确认 KV 绑定配置正确

2. **构建失败**

   - 检查 TypeScript 类型错误: `bun run type-check`
   - 确认依赖安装完整: `bun install`

3. **环境变量未生效**
   - 检查 `wrangler.pages.toml` 配置
   - 通过 Dashboard 验证环境变量设置

### 调试命令

```bash
# 类型检查
bun run type-check

# 本地预览构建结果
cd frontend && bun run preview

# 查看 Pages 部署日志
wrangler pages deployment list
```

## 项目结构说明

### 开发 vs 生产

- **开发模式**:

  - 前端: Vite 开发服务器 (3000 端口)
  - 后端: Workers 开发服务器 (8787 端口) - 使用 `src/index.ts`
  - 配置: `wrangler.dev.toml`
 

### 文件说明

```
node-fetch/
├── src/index.ts          # 仅用于开发模式的 Workers 入口
├── functions/api/[[path]].ts  # 生产模式的 Pages Functions 入口
├── wrangler.toml     # 配置文件
└── src/                  # 共享的业务逻辑代码
```

## 最佳实践

1. **开发时使用分离模式** (`bun dev`)，便于调试
2. **生产部署使用 Pages Functions**，简化运维
3. **定期更新依赖**，保持安全性
4. **使用环境变量管理敏感配置**
5. **设置 CI/CD 自动化部署流程**
