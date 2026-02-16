# 用户配置管理系统

## 概述

用户配置管理系统允许用户通过 Web 界面管理自己的配置，支持从 KV 存储和环境变量两种方式读取配置，优先级为：KV 配置 > 环境变量配置。

## 功能特性

### 用户配置管理

- ✅ 支持 KV 存储和环境变量两种配置源
- ✅ 配置优先级：KV > 环境变量
- ✅ Web 前端界面进行可视化配置管理
- ✅ 基于 accessToken 的身份验证
- ✅ 实时配置验证和语法检查
- ✅ YAML 格式配置编辑
- ✅ 配置预览和错误提示

### 超级管理员功能

- ✅ 系统统计和监控仪表板
- ✅ 用户列表管理和批量操作
- ✅ 用户配置查看和编辑
- ✅ 用户流量信息显示和刷新
- ✅ 配置模板管理和应用
- ✅ 操作日志记录和查询
- ✅ 基于 superAdminToken 的权限控制

## API 接口

### 1. 获取用户配置

```
GET /api/config/users/:userId?token=xxx
```

**响应示例：**

```json
{
	"config": {
		"subscribe": "https://example.com/subscription",
		"accessToken": "your-access-token",
		"ruleUrl": "https://example.com/rules",
		"fileName": "config.yaml",
		"multiPortMode": ["TW", "SG", "JP"],
		"appendSubList": [
			{
				"subscribe": "https://example.com/sub1",
				"flag": "sub1",
				"includeArea": ["US", "HK"]
			}
		],
		"excludeRegex": ".*test.*"
	},
	"meta": {
		"lastModified": "2024-01-01T00:00:00.000Z",
		"source": "kv",
		"userId": "user123"
	}
}
```

### 2. 更新用户配置

```
POST /api/config/users/:userId?token=xxx
Content-Type: application/json

{
  "config": {
    "subscribe": "https://example.com/subscription",
    "accessToken": "your-access-token"
  }
}
```

### 3. 删除用户配置

```
DELETE /api/config/users/:userId?token=xxx
```

### 4. 获取所有用户列表

```
GET /api/config/users?token=xxx
```

## 超级管理员 API 接口

### 1. 获取系统统计数据

```
GET /api/admin/stats?superToken=xxx
```

**响应示例：**

```json
{
	"success": true,
	"data": {
		"totalUsers": 25,
		"activeUsers": 18,
		"configCompleteRate": 92.5,
		"todayNewUsers": 3
	}
}
```

### 2. 获取用户列表

```
GET /api/admin/users?superToken=xxx
```

### 3. 获取用户详情

```
GET /api/admin/users/:userId?superToken=xxx
```

### 4. 更新用户配置

```
PUT /api/admin/users/:userId?superToken=xxx
Content-Type: application/json

{
  "config": {
    "subscribe": "https://example.com/subscription",
    "accessToken": "user-access-token"
  }
}
```

### 5. 删除用户

```
DELETE /api/admin/users/:userId?superToken=xxx
```

### 6. 创建用户

```
POST /api/admin/users?superToken=xxx
Content-Type: application/json

{
  "userId": "newuser",
  "config": {
    "subscribe": "https://example.com/subscription",
    "accessToken": "user-access-token"
  }
}
```

### 7. 批量操作用户

```
POST /api/admin/users/batch?superToken=xxx
Content-Type: application/json

{
  "userIds": ["user1", "user2", "user3"],
  "operation": "delete"
}
```

### 8. 获取配置模板列表

```
GET /api/admin/templates?superToken=xxx
```

### 9. 创建配置模板

```
POST /api/admin/templates?superToken=xxx
Content-Type: application/json

{
  "name": "企业模板",
  "description": "企业用户的标准配置模板",
  "template": {
    "ruleUrl": "https://company.com/rules",
    "multiPortMode": ["TW", "SG", "JP"]
  }
}
```

### 10. 应用模板到用户

```
POST /api/admin/templates/:templateId/apply?superToken=xxx
Content-Type: application/json

{
  "userId": "target-user"
}
```

### 11. 获取操作日志

```
GET /api/admin/logs?superToken=xxx&date=2024-01-01&limit=50
```

### 12. 获取系统健康状态

```
GET /api/admin/health?superToken=xxx
```

### 13. 刷新用户流量信息

```
POST /api/admin/users/:userId/traffic/refresh?superToken=xxx
```

**响应示例：**

```json
{
	"success": true,
	"data": {
		"message": "流量信息刷新成功",
		"userId": "user123",
		"trafficInfo": {
			"upload": 1234567890,
			"download": 9876543210,
			"total": 21474836480,
			"used": 11111111100,
			"remaining": 10363725380,
			"expire": 1640995200,
			"isExpired": false,
			"usagePercent": 51.73
		}
	}
}
```

## Web 界面

### 访问配置管理页面

```
https://your-domain.com/config/:userId?token=xxx
```

## 超级管理员 Web 界面

### 访问超级管理员控制台

```
https://your-domain.com/admin/dashboard?superToken=xxx
```

### 界面功能

- **控制台**：系统统计数据和最近活动展示
- **用户管理**：用户列表查看、编辑、删除和批量操作，流量使用情况显示
- **系统监控**：实时监控系统状态和性能指标（开发中）
- **配置模板**：配置模板管理和应用（开发中）

### 页面路径

- `/admin/dashboard` - 控制台首页
- `/admin/users` - 用户管理页面
- `/admin/monitor` - 系统监控页面
- `/admin/templates` - 配置模板页面

### 页面功能

- **配置编辑器**：支持 YAML 语法高亮的代码编辑器
- **实时预览**：配置修改后的实时预览效果
- **配置验证**：实时验证配置格式和必填字段
- **保存功能**：一键保存配置到 KV 存储
- **流量监控**：显示用户订阅流量使用情况，包括进度条和使用百分比
- **流量刷新**：一键刷新用户的最新流量信息

## 配置格式

### 必需字段

- `subscribe`: 订阅地址（URL 格式）
- `accessToken`: 访问令牌

### 可选字段

- `ruleUrl`: 规则模板链接
- `fileName`: 文件名
- `multiPortMode`: 多端口模式地区代码数组
- `appendSubList`: 追加订阅列表
- `excludeRegex`: 排除正则表达式

### 配置示例

```yaml
# 用户配置
subscribe: 'https://example.com/subscription'
accessToken: 'your-access-token'
ruleUrl: 'https://example.com/rules'
fileName: 'config.yaml'

# 多端口模式
multiPortMode:
  - TW
  - SG
  - JP

# 追加订阅列表
appendSubList:
  - subscribe: 'https://example.com/sub1'
    flag: 'sub1'
    includeArea:
      - US
      - HK
  - subscribe: 'https://example.com/sub2'
    flag: 'sub2'

# 排除正则表达式
excludeRegex: '.*test.*'
```

## 部署要求

### 1. Cloudflare Workers KV 绑定

在 `wrangler.toml` 中添加：

```toml
[[kv_namespaces]]
binding = "USERS_KV"
id = "your-kv-namespace-id"
```

### 2. 环境变量

确保 `DB_USER` 环境变量包含默认用户配置：

```json
{
	"user123": {
		"subscribe": "https://example.com/subscription",
		"accessToken": "your-access-token"
	}
}
```

### 3. 超级管理员配置

在环境变量中设置超级管理员访问令牌：

```
SUPER_ADMIN_TOKEN=your-super-admin-token-here
```

## 安全考虑

1. **身份验证**：
   - 用户 API：需要有效的 accessToken
   - 超级管理员 API：需要有效的 superAdminToken
2. **权限控制**：
   - 用户只能访问和修改自己的配置
   - 超级管理员可以管理所有用户和系统设置
3. **输入验证**：配置数据会进行格式和类型验证
4. **CORS 支持**：API 支持跨域请求
5. **操作审计**：超级管理员的所有操作都会记录日志

## 使用流程

1. **获取访问令牌**：用户需要有效的 accessToken
2. **访问配置页面**：打开 `https://your-domain.com/config/:userId?token=xxx`
3. **编辑配置**：在 Web 界面中编辑 YAML 配置
4. **验证配置**：系统会实时验证配置格式
5. **保存配置**：点击保存按钮将配置存储到 KV
6. **使用配置**：系统会自动使用最新的配置

## 超级管理员使用流程

1. **设置超级管理员令牌**：在环境变量中配置 `SUPER_ADMIN_TOKEN`
2. **访问管理控制台**：打开 `https://your-domain.com/admin/dashboard?superToken=xxx`
3. **查看系统统计**：在控制台查看用户数量、活跃度等统计信息
4. **管理用户**：在用户管理页面查看、编辑、删除用户配置
5. **批量操作**：对多个用户进行批量操作（删除、禁用等）
6. **配置模板**：创建和管理配置模板，应用到用户
7. **查看日志**：查看所有管理员操作的审计日志

## 错误处理

- **401 Unauthorized**：缺少或无效的 accessToken
- **403 Forbidden**：用户权限不足
- **404 Not Found**：用户配置不存在
- **400 Bad Request**：配置格式错误
- **500 Internal Server Error**：服务器内部错误

## 开发说明

### 文件结构

```
src/module/userManager/
├── userManager.ts          # 用户配置管理核心逻辑
├── superAdminManager.ts    # 超级管理员管理核心逻辑
├── users-kv.md            # 产品需求文档
├── super-admin.md         # 超级管理员需求文档
└── README.md              # 使用说明文档

src/routes/handler/
├── userConfigHandler.ts   # 用户API处理器
├── superAdminHandler.ts   # 超级管理员API处理器
└── pages/
    ├── configPageHandler.ts   # 用户配置页面处理器
    └── adminPageHandler.ts    # 超级管理员页面处理器
```

### 核心类

- `UserManager`: 用户配置管理核心类
- `SuperAdminManager`: 超级管理员管理核心类
- `UserConfigHandler`: 用户 API 请求处理器
- `SuperAdminHandler`: 超级管理员 API 请求处理器
- `ConfigPageHandler`: 用户配置 Web 页面处理器
- `AdminPageHandler`: 超级管理员 Web 页面处理器

### 扩展功能

- 支持更多配置字段
- 添加配置版本管理
- 实现配置导入/导出
- 添加操作日志记录
