## 本项目是生成订阅配置给clash的工具

- 直接使用由专业人员写好的强大分流规则，确保更加合理和高性能、隐匿性更健壮的分流规则

- 可以无缝接入任何服务商的节点

- 每一分钟会做一次延时测试，确保你的链路是通的，且在最佳线路上

- 一次编写扩展规则，在多设备同时应用，因为网址是不变的，但是内部的规则，如添加覆写，过滤节点、新增分流规则，是在本网站完成。

使用场景1：
我的电脑上加了一个规则，我直接在本网站去修改，那这个规则只要在手机软路由等其他设备更新一下即可自动同步。

- 可以增添、合并多个订阅，但会单独显示每一个订阅的使用流量状态，不会因为忘记充值而断网，同时也确保互相容灾

---

## 技术栈

- Next.js App Router（Next 16）+ React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui（Radix UI 组件体系）
- Drizzle ORM + Turso / libSQL（SQLite）
- OpenNext（Cloudflare Workers/Pages 部署）
- ky（HTTP 客户端）+ zod（配置校验）+ Monaco Editor（配置编辑）

---

## 技术设计

### 架构概览

- 前端：Next.js App Router 页面与组件，负责订阅配置与管理界面
- 后端：Next.js Route Handlers（/api/*），提供用户配置、模板与管理接口
- 数据层：Drizzle ORM 统一访问 Turso / libSQL，支持本地开发、Vercel 与 Cloudflare

### 核心模块

- 用户配置：保存用户订阅、规则与覆写信息，订阅地址固定，规则可在线更新
- 动态订阅抓取：拉取订阅内容并持久化，支持自动重试与内容格式转换
- 规则合并与生成：多订阅聚合、策略化合并（多端口/多订阅策略），输出 Clash YAML
- 管理后台：基于 superToken 进行管理员操作（用户管理、模板管理、日志记录）
 

### 鉴权机制

- 管理端：通过 superToken 访问（Query 参数或环境变量）
- 用户端：通过 token 访问用户配置与订阅

---

## 运行教程

### 1) 安装依赖

```bash
bun install
```

### 2) 配置环境变量

创建 `.env.local`，至少包含以下环境变量：

```bash
SUPER_ADMIN_TOKEN="your-super-token"
TURSO_DATABASE_URL="libsql://your-database.turso.io"
TURSO_AUTH_TOKEN="your-turso-token"
```

### 3) 本地开发

```bash
npm run dev
```

### 4) 数据库迁移（可选）

```bash
npm run db:generate
npm run db:push
```

### 5) 部署

Vercel:

```bash
npm run build
```

Cloudflare:

```bash
npm run preview
npm run deploy
```

---

## 常用访问入口

- 管理后台：`/admin/dashboard?superToken=YOUR_TOKEN`
- 用户配置页：`/config?uid=USER_ID&token=USER_TOKEN`
