# 节点管理前端

基于 Preact + TypeScript + TailwindCSS 的现代化后台管理系统。

## 🚀 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 环境配置

创建 `.env` 文件：

```bash
# API 服务地址
VITE_API_BASE_URL=http://localhost:8787

# 开发环境配置  
NODE_ENV=development
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
```

## 📁 项目结构

```
frontend/
├── src/
│   ├── api/           # API 客户端
│   ├── components/    # 可复用组件
│   ├── pages/         # 页面组件
│   │   ├── admin/     # 管理员页面
│   │   └── UserConfigPage.tsx
│   ├── types/         # TypeScript 类型定义
│   ├── App.tsx        # 根组件
│   ├── main.tsx       # 应用入口
│   └── index.css      # 全局样式
├── public/            # 静态资源
├── package.json
├── vite.config.ts     # Vite 配置
├── tailwind.config.js # TailwindCSS 配置
└── tsconfig.json      # TypeScript 配置
```

## 🔗 页面路由

- `/` - 首页说明
- `/config/:userId?token=xxx` - 用户配置管理
- `/admin/dashboard?superToken=xxx` - 管理员控制台
- `/admin/users?superToken=xxx` - 用户管理
- `/admin/monitor?superToken=xxx` - 系统监控
- `/admin/templates?superToken=xxx` - 配置模板

## 🛠️ 技术栈

- **Preact** - 轻量级 React 替代品
- **TypeScript** - 类型安全
- **Vite** - 现代化构建工具
- **TailwindCSS** - 实用优先的 CSS 框架
- **Preact Router** - 客户端路由
- **ky** - 现代化 HTTP 客户端
- **js-yaml** - YAML 解析器

## 🔧 开发指南

### API 调用

```typescript
import { userConfigApi, adminApi } from '@/api/client';

// 获取用户配置
const config = await userConfigApi.get(userId, token);

// 获取管理员统计
const stats = await adminApi.getStats(superToken);
```

### 添加新页面

1. 在 `src/pages/` 中创建组件
2. 在 `src/App.tsx` 中添加路由
3. 更新类型定义（如需要）

### 样式规范

使用 TailwindCSS 工具类：

```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  <h1 className="text-2xl font-bold text-gray-900 mb-4">标题</h1>
  <p className="text-gray-600">内容</p>
</div>
```

## 📦 构建部署

### Cloudflare Pages 部署

1. 连接 Git 仓库
2. 设置构建命令：`npm run build`
3. 设置输出目录：`dist`
4. 配置环境变量：`VITE_API_BASE_URL`

### 路由配置

创建 `public/_routes.json`：

```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": ["/*"]
}
```

这样配置后：
- 前端页面由 Cloudflare Pages 处理
- API 请求转发到 Workers 后端

## 🔍 调试

### 开发环境调试

```bash
# 启动开发服务器（带热重载）
npm run dev

# 类型检查
npm run type-check

# 预览构建结果
npm run preview
```

### 生产环境调试

1. 检查控制台错误
2. 验证 API 请求地址
3. 确认环境变量配置

## 📝 注意事项

1. **路径映射**：使用 `@/` 前缀引用 src 目录
2. **API 调用**：统一使用 `api/client.ts` 中的方法
3. **类型安全**：所有 API 响应都有对应的 TypeScript 类型
4. **错误处理**：使用 try-catch 处理异步操作
5. **响应式设计**：所有页面都支持移动端适配

## 🚧 待完成功能

- [ ] 用户管理页面完整实现
- [ ] 系统监控页面
- [ ] 配置模板管理
- [ ] 数据可视化图表
- [ ] 实时状态更新
- [ ] 更完善的错误处理
- [ ] 单元测试

## 🤝 开发约定

1. 组件名使用 PascalCase
2. 文件名使用 camelCase
3. 样式使用 TailwindCSS 类名
4. API 调用统一错误处理
5. 所有异步操作添加 loading 状态 