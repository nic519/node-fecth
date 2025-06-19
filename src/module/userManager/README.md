# 用户配置管理系统

## 概述

用户配置管理系统允许用户通过Web界面管理自己的配置，支持从KV存储和环境变量两种方式读取配置，优先级为：KV配置 > 环境变量配置。

## 功能特性

- ✅ 支持KV存储和环境变量两种配置源
- ✅ 配置优先级：KV > 环境变量
- ✅ Web前端界面进行可视化配置管理
- ✅ 基于accessToken的身份验证
- ✅ 实时配置验证和语法检查
- ✅ YAML格式配置编辑
- ✅ 配置预览和错误提示

## API接口

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

## Web界面

### 访问配置管理页面
```
https://your-domain.com/config/:userId?token=xxx
```

### 页面功能
- **配置编辑器**：支持YAML语法高亮的代码编辑器
- **实时预览**：配置修改后的实时预览效果
- **配置验证**：实时验证配置格式和必填字段
- **保存功能**：一键保存配置到KV存储
- **重置功能**：重置为默认配置模板

## 配置格式

### 必需字段
- `subscribe`: 订阅地址（URL格式）
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
subscribe: "https://example.com/subscription"
accessToken: "your-access-token"
ruleUrl: "https://example.com/rules"
fileName: "config.yaml"

# 多端口模式
multiPortMode:
  - TW
  - SG
  - JP

# 追加订阅列表
appendSubList:
  - subscribe: "https://example.com/sub1"
    flag: "sub1"
    includeArea:
      - US
      - HK
  - subscribe: "https://example.com/sub2"
    flag: "sub2"

# 排除正则表达式
excludeRegex: ".*test.*"
```

## 部署要求

### 1. Cloudflare Workers KV绑定
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

## 安全考虑

1. **身份验证**：所有API调用都需要有效的accessToken
2. **权限控制**：用户只能访问和修改自己的配置
3. **输入验证**：配置数据会进行格式和类型验证
4. **CORS支持**：API支持跨域请求

## 使用流程

1. **获取访问令牌**：用户需要有效的accessToken
2. **访问配置页面**：打开 `https://your-domain.com/config/:userId?token=xxx`
3. **编辑配置**：在Web界面中编辑YAML配置
4. **验证配置**：系统会实时验证配置格式
5. **保存配置**：点击保存按钮将配置存储到KV
6. **使用配置**：系统会自动使用最新的配置

## 错误处理

- **401 Unauthorized**：缺少或无效的accessToken
- **403 Forbidden**：用户权限不足
- **404 Not Found**：用户配置不存在
- **400 Bad Request**：配置格式错误
- **500 Internal Server Error**：服务器内部错误

## 开发说明

### 文件结构
```
src/module/userManager/
├── userManager.ts          # 用户配置管理核心逻辑
├── users-kv.md            # 产品需求文档
└── README.md              # 使用说明文档

src/routes/handler/
├── userConfigHandler.ts   # API处理器
└── configPageHandler.ts   # Web页面处理器
```

### 核心类
- `UserManager`: 用户配置管理核心类
- `UserConfigHandler`: API请求处理器
- `ConfigPageHandler`: Web页面处理器

### 扩展功能
- 支持更多配置字段
- 添加配置版本管理
- 实现配置导入/导出
- 添加操作日志记录 