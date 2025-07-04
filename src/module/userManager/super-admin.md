# 超级管理员系统需求文档

## 项目背景

当前系统已经支持用户通过Web界面管理自己的配置。现在需要为超级管理员提供一个统一的管理平台，用于管理所有用户的配置、权限和系统运行状态。

## 功能需求

### 1. 用户管理
#### 1.1 用户列表
- **功能描述**：展示所有用户的基本信息和状态
- **显示字段**：
  - 用户ID
  - 创建时间
  - 最后活跃时间
  - 配置状态（已配置/未配置）
  - 配置来源（KV/环境变量）
  - 订阅地址状态（有效/无效）
  - 操作按钮（查看、编辑、删除、禁用）

#### 1.2 用户详情查看
- **功能描述**：查看用户的完整配置信息
- **展示内容**：
  - 用户基本信息
  - 完整配置内容（YAML格式）
  - 配置历史变更记录
  - 使用统计数据

#### 1.3 用户配置编辑
- **功能描述**：超级管理员可以直接编辑任何用户的配置
- **编辑功能**：
  - YAML配置编辑器
  - 实时配置验证
  - 配置模板应用
  - 批量配置更新

#### 1.4 用户操作
- **新增用户**：创建新用户并设置初始配置
- **删除用户**：删除用户及其所有配置数据
- **禁用/启用用户**：临时禁用用户访问
- **重置用户配置**：恢复为默认配置

### 2. 批量操作
#### 2.1 批量用户管理
- **批量选择**：支持多选用户进行批量操作
- **批量操作类型**：
  - 批量删除用户
  - 批量禁用/启用
  - 批量配置更新
  - 批量导出配置

#### 2.2 配置模板管理
- **模板创建**：创建配置模板供用户使用
- **模板应用**：将模板应用到指定用户
- **默认模板**：设置新用户的默认配置模板

### 3. 系统监控
#### 3.1 统计数据
- **用户统计**：
  - 总用户数
  - 活跃用户数
  - 今日新增用户
  - 配置完成率
- **配置统计**：
  - KV配置用户数
  - 环境变量配置用户数
  - 配置错误率
  - 最常用配置选项

#### 3.2 系统状态
- **KV存储状态**：存储使用情况和性能指标
- **API调用统计**：请求数量、响应时间、错误率
- **资源使用情况**：Worker执行时间、内存使用等

### 4. 权限管理
#### 4.1 超级管理员认证
- **认证方式**：基于特殊的superAdminToken
- **权限验证**：每个操作都需要验证超级管理员权限
- **会话管理**：超级管理员登录会话管理

#### 4.2 操作日志
- **日志记录**：记录所有管理员操作
- **日志内容**：
  - 操作时间
  - 操作类型
  - 目标用户
  - 操作结果
  - IP地址


## 界面设计

### 1. 主控制台 Dashboard
- **页面路径**：`/admin/dashboard?superToken=xxx`
- **布局结构**：
  - 顶部导航栏（用户管理、系统监控、配置模板、操作日志）
  - 统计卡片区域（关键指标展示）
  - 快速操作区域（常用功能入口）
  - 最近活动列表

### 2. 用户管理页面
- **页面路径**：`/admin/users?superToken=xxx`
- **功能模块**：
  - 用户搜索和筛选
  - 用户列表表格
  - 批量操作工具栏
  - 用户详情侧边栏

### 3. 系统监控页面
- **页面路径**：`/admin/monitor?superToken=xxx`
- **监控内容**：
  - 实时统计图表
  - 系统性能指标
  - 错误日志监控
  - 资源使用趋势


## 技术实现

### 1. API接口设计
#### 1.1 用户管理接口
```
GET /api/admin/users - 获取所有用户列表
GET /api/admin/users/:userId - 获取用户详情
PUT /api/admin/users/:userId - 更新用户配置
DELETE /api/admin/users/:userId - 删除用户
POST /api/admin/users - 创建新用户
POST /api/admin/users/batch - 批量操作用户
```

#### 1.2 系统监控接口
```
GET /api/admin/stats - 获取系统统计数据
GET /api/admin/logs - 获取操作日志
GET /api/admin/health - 获取系统健康状态
```

#### 1.3 配置模板接口
```
GET /api/admin/templates - 获取所有模板
POST /api/admin/templates - 创建新模板
PUT /api/admin/templates/:id - 更新模板
DELETE /api/admin/templates/:id - 删除模板
POST /api/admin/templates/:id/apply - 应用模板到用户
```

### 2. 数据存储
#### 2.1 KV存储结构
```
admin:users:list - 用户列表索引
admin:users:{userId} - 用户详细信息
admin:templates:{templateId} - 配置模板
admin:logs:{date} - 操作日志（按日期分组）
admin:stats:{date} - 统计数据（按日期分组）
```

#### 2.2 权限控制
- 超级管理员Token验证
- 操作权限检查
- API访问频率限制

### 3. 前端界面
#### 3.1 技术选型
- 原生JavaScript/TypeScript
- 响应式CSS布局
- Chart.js 图表库
- Monaco Editor 代码编辑

#### 3.2 组件设计
- UserTable：用户列表组件
- UserEditor：用户配置编辑组件
- StatsChart：统计图表组件
- TemplateManager：模板管理组件

## 安全考虑

### 1. 身份认证
- 超级管理员Token必须与普通用户Token分离
- Token过期时间设置（建议4小时）
- IP白名单限制（可选）

### 2. 操作审计
- 所有管理员操作必须记录日志
- 敏感操作需要二次确认
- 定期清理过期日志

### 3. 数据保护
- 用户敏感信息脱敏显示
- 配置数据加密存储（可选）
- 定期数据备份

## 部署配置

### 1. 环境变量
```
SUPER_ADMIN_TOKEN=xxx  # 超级管理员访问令牌
ADMIN_SESSION_TIMEOUT=14400  # 会话超时时间（秒）
ADMIN_IP_WHITELIST=127.0.0.1,192.168.1.0/24  # IP白名单（可选）
LOG_RETENTION_DAYS=30  # 日志保留天数
```

### 2. KV命名空间
```
ADMIN_KV  # 管理员数据存储
LOGS_KV   # 操作日志存储
STATS_KV  # 统计数据存储
```

## 开发计划

### 阶段一：核心功能（1-2周）
- [ ] 用户列表查看
- [ ] 用户详情查看
- [ ] 基本的用户配置编辑
- [ ] 超级管理员认证

### 阶段二：管理功能（1周）
- [ ] 用户增删改操作
- [ ] 批量操作功能
- [ ] 操作日志记录

### 阶段三：监控统计（1周）
- [ ] 系统统计数据
- [ ] 监控图表展示
- [ ] 配置模板管理

### 阶段四：优化完善（1周）
- [ ] 界面美化优化
- [ ] 性能优化
- [ ] 安全加固
- [ ] 文档完善

## 验收标准

1. **功能完整性**：所有需求功能正常工作
2. **界面友好性**：界面直观易用，响应式设计
3. **性能要求**：页面加载时间 < 3秒，操作响应时间 < 1秒
4. **安全性**：通过安全审计，无明显安全漏洞
5. **稳定性**：连续运行24小时无崩溃
6. **兼容性**：支持主流浏览器（Chrome、Firefox、Safari、Edge）

## 后续扩展

- 多租户管理支持
- 更细粒度的权限控制
- 配置变更工作流审批
- 与外部系统集成（如企业SSO）
- 移动端管理界面
- API调用监控和限流
- 自动化运维脚本执行 