# 用户模块重构说明

## 📋 概述

本次重构将用户相关的 CRUD 操作进行了统一管理，通过服务层（Service Layer）模式实现代码复用，并通过路由和中间件实现权限控制。

## 🏗️ 架构设计

### 分层架构

```
┌─────────────────────────────────────────────────┐
│              路由层 (API Layer)                  │
│  - api.user.ts          (普通用户路由)           │
│  - api.user-for-admin.ts (管理员路由)            │
│  - api.admin.ts         (管理员中间件)           │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│            服务层 (Service Layer)                │
│  - user.service.ts   (统一的 CRUD 业务逻辑)      │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           数据访问层 (Data Access Layer)         │
│  - base-crud.ts      (通用 CRUD 操作)            │
│  - schema.ts         (数据库模型)                │
└─────────────────────────────────────────────────┘
```

## 📁 文件结构

```
src/routes/modules/user/
├── api.user.ts                  # 普通用户 API（使用 CRUD 工厂 + 钩子）⭐ 新简化
├── api.user-for-admin.ts        # 管理员用户管理 API（使用 CRUD 工厂）⭐
├── user.service.ts              # 统一的用户服务层
├── user.transformer.ts          # 用户数据转换器（config 序列化/反序列化）⭐
├── user.hooks.ts                # 用户身份验证钩子 ⭐ 新增
├── schema.user.ts               # 所有用户相关的 Schema 定义
├── method.user.ts               # 普通用户路由定义（标准 REST）⭐ 已更新
├── method.user-for-admin.ts     # 管理员路由定义
└── README.md                    # 本文档
```

## 🔑 权限控制

### 普通用户（需要 uid + token）

**路由前缀**: `/api/config/user/`

- `POST /api/config/user/update?uid={uid}&token={token}` - 更新自己的配置（upsert）
- `GET /api/config/user/detail?uid={uid}&token={token}` - 获取自己的配置

**验证方式**:

- 查询参数中需要提供 `uid` 和 `token`
- 通过 `AuthUtils.authenticate()` 验证身份

### 管理员（需要 superToken）

**路由前缀**: `/api/admin/users`

- `GET /api/admin/users?superToken={token}` - 获取所有用户列表
- `GET /api/admin/users/{uid}?superToken={token}` - 获取指定用户详情
- `POST /api/admin/users?superToken={token}` - 创建新用户
- `PUT /api/admin/users/{uid}?superToken={token}` - 更新用户配置
- `DELETE /api/admin/users/{uid}?superToken={token}` - 删除用户

**验证方式**:

- 在 `api.admin.ts` 中通过中间件统一验证 `superToken`
- 使用 `SuperAdminManager.validateSuperAdmin()` 验证管理员权限

## 🔧 核心组件

### 1. APIUser (api.user.ts) ⭐ 最新优化

普通用户配置 API，使用 CRUD 工厂 + 钩子，代码极其简洁：

```typescript
export class APIUser extends BaseAPI {
	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		// 使用工厂自动生成 CRUD 处理器（带身份验证钩子）
		const crudHandlers = createCRUDHandlers<User, IScUserApiModel>({
			table: users,
			resourceName: '用户',
			idParamName: 'uid',
			transformer: userTransformer,
			hooks: {
				beforeEach: userAuthHook, // 钩子：每个操作前验证身份
			},
		});

		// 注册路由
		app.openapi(getUserRoute, crudHandlers.get); // GET /api/users/:uid
		app.openapi(updateUserRoute, crudHandlers.update); // PUT /api/users/:uid
	}
}
```

**代码行数对比**：

- 重构前：**109 行**
- 重构后：**30 行**
- 减少：**72%** 🎉

### 2. APIUserForAdmin (api.user-for-admin.ts) ⭐ 已优化

管理员用户管理 API，使用 CRUD 工厂模式，代码极其简洁：

```typescript
export class APIUserForAdmin extends BaseAPI {
	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		// 使用工厂自动生成标准 CRUD 处理器
		const crudHandlers = createCRUDHandlers<User, IScUserApiModel>({
			table: users,
			resourceName: '用户',
			idParamName: 'uid',
			dataKey: 'users',
			transformer: userTransformer, // 自动处理 config 序列化
		});

		// 注册所有 CRUD 路由（只需5行）
		app.openapi(RUsersList, crudHandlers.list);
		app.openapi(RUserGet, crudHandlers.get);
		app.openapi(RUserCreate, crudHandlers.create);
		app.openapi(RUserUpdate, crudHandlers.update);
		app.openapi(RUserDelete, crudHandlers.delete);
	}
}
```

**代码行数对比**：

- 重构前：**175 行**
- 重构后：**30 行**
- 减少：**83%** 🎉

### 3. UserAuthHook (user.hooks.ts) ⭐ 新增

用户身份验证钩子，用于 CRUD 操作前的统一验证：

```typescript
export const userAuthHook = async (c: any): Promise<void | Response> => {
	const uid = c.req.param('uid');
	const token = c.req.query('token');

	if (!uid || !token) {
		return c.json({ code: 401, msg: '缺少认证参数' }, 401);
	}

	try {
		await AuthUtils.authenticate(c.req.raw, c.env, uid);
		// 验证成功，继续执行后续操作
	} catch (error) {
		return c.json({ code: 401, msg: '身份验证失败' }, 401);
	}
};
```

**使用场景**：

- 在 CRUD 工厂的 `beforeEach` 钩子中使用
- 每个操作前自动验证用户身份
- 如果验证失败，直接返回 401 响应，不执行后续操作

### 4. UserTransformer (user.transformer.ts) ⭐ 已有

用户数据转换器，处理 config 字段的序列化和反序列化：

```typescript
export const userTransformer: DataTransformer<User, IScUserApiModel> = {
	// 从数据库到 API（JSON 字符串 -> 对象）
	toApi: (dbUser: User): IScUserApiModel => ({
		id: dbUser.id,
		config: JSON.parse(dbUser.config), // 自动解析
		accessToken: dbUser.accessToken,
		createdAt: dbUser.createdAt,
		updatedAt: dbUser.updatedAt,
	}),

	// 从 API 到数据库（对象 -> JSON 字符串）
	fromApi: (apiData: any): Partial<User> => ({
		id: apiData.uid,
		config: JSON.stringify(apiData.config), // 自动序列化
		accessToken: apiData.config.accessToken,
	}),
};
```

### 5. UserService (user.service.ts)

统一的用户服务层，封装所有用户 CRUD 业务逻辑。

```typescript
class UserService {
	// 获取所有用户
	async getAllUsers(): Promise<IScUserApiModel[]>;

	// 获取单个用户
	async getUserById(uid: string): Promise<IScUserApiModel | null>;

	// 创建用户
	async createUser(uid: string, config: IUserConfig): Promise<IScUserApiModel>;

	// 更新用户
	async updateUser(uid: string, config: IUserConfig): Promise<IScUserApiModel>;

	// 创建或更新（Upsert）
	async upsertUser(uid: string, config: IUserConfig): Promise<IScUserApiModel>;

	// 删除用户
	async deleteUser(uid: string): Promise<void>;

	// 检查用户是否存在
	async userExists(uid: string): Promise<boolean>;
}
```

**特点**：

- 自动处理 config 的序列化/反序列化（JSON string ↔ Object）
- 统一的错误处理
- 数据库模型到 API 模型的转换

### 6. Schema 定义 (schema.user.ts)

集中管理所有用户相关的 Schema：

#### 基础 Schema

- `UserConfigSchema` - 用户配置
- `AreaCodeSchema` - 地区代码
- `SubConfigSchema` - 订阅配置
- `UserConfigMetaSchema` - 配置元数据

#### 数据库模型

- `ScUserDbModel` - 数据库记录（config 为 JSON 字符串）
- `ScUserApiModel` - API 返回（config 已解析为对象）

#### 请求参数

- `ScUserTokenParams` - 用户 token 验证参数
- `ScSuperAdminTokenParams` - 超级管理员 token 参数
- `ScUserIdParams` - 用户 ID 路径参数

#### 请求体

- `ScUserCreateReq` - 创建用户请求
- `ScUserUpdateReq` - 更新用户配置请求（普通用户）
- `ScUserAdminUpdateReq` - 更新用户配置请求（管理员）

#### 响应

- `ScUserDetailResponse` - 用户详情响应
- `ScUserUpdateResponse` - 更新响应
- `ScUserListResponse` - 用户列表响应
- `ScUserGetResponse` - 获取单个用户响应
- `ScUserCreateResponse` - 创建用户响应
- `ScUserAdminUpdateResponse` - 管理员更新响应
- `ScUserDeleteResponse` - 删除用户响应

## 🔄 数据流

### 普通用户更新配置

```
1. 用户请求: POST /api/config/user/update?uid=xxx&token=xxx
             Body: { config: {...} }

2. 身份验证: AuthUtils.authenticate(uid, token)

3. 服务层处理: userService.upsertUser(uid, config)
   - 检查用户是否存在
   - 存在则更新，不存在则创建
   - 自动序列化 config 为 JSON 字符串

4. 返回结果: { uid, timestamp, message }
```

### 管理员获取用户列表

```
1. 管理员请求: GET /api/admin/users?superToken=xxx

2. 权限验证: `APIUserForAdmin` 在 `/api/admin/*` 中间件中验证 `superToken`

3. 服务层处理: userService.getAllUsers()
   - 查询所有用户
   - 自动解析每个用户的 config

4. 返回结果: { users: [...] }
```

## ✅ 优势

### 1. 代码复用

- 所有 CRUD 操作都在 `UserService` 中实现
- 普通用户和管理员路由共享相同的业务逻辑

### 2. 权限分离

- 通过路由和中间件清晰区分普通用户和管理员权限
- 统一的验证逻辑

### 3. 类型安全

- 所有 Schema 集中管理在 `schema.user.ts`
- 完整的 TypeScript 类型支持
- 通过 Zod 进行运行时验证

### 4. 易于维护

- 清晰的分层架构
- 单一职责原则
- 便于测试和扩展

## 🔧 使用示例

### 使用 CRUD 工厂（推荐）⭐

```typescript
import { createCRUDHandlers } from '@/db/crud-api-factory';
import { users, type User } from '@/db/schema';
import { IScUserApiModel } from '@/routes/modules/user/schema.user';
import { userTransformer } from '@/routes/modules/user/user.transformer';

// 创建 CRUD 处理器
const crudHandlers = createCRUDHandlers<User, IScUserApiModel>({
	table: users,
	resourceName: '用户',
	idParamName: 'uid',
	dataKey: 'users',
	transformer: userTransformer, // 自动处理 config 序列化
});

// 注册路由
app.openapi(listRoute, crudHandlers.list);
app.openapi(getRoute, crudHandlers.get);
app.openapi(createRoute, crudHandlers.create);
app.openapi(updateRoute, crudHandlers.update);
app.openapi(deleteRoute, crudHandlers.delete);
```

### 在路由中使用 UserService

```typescript
import { UserService } from '@/routes/modules/user/user.service';

// 创建服务实例
const userService = new UserService(c.env);

// 获取用户
const user = await userService.getUserById(uid);

// 更新用户
const updated = await userService.updateUser(uid, config);

// 创建或更新
const saved = await userService.upsertUser(uid, config);
```

### 使用统一的 Schema

```typescript
import { ScUserUpdateReq, IUserConfig } from '@/routes/modules/user/schema.user';

// 验证请求体
const body = c.req.valid('json'); // 自动使用 ScUserUpdateReq 验证

// 使用类型
const config: IUserConfig = body.config;
```

## 📝 注意事项

1. **数据库存储格式**: 用户的 `config` 在数据库中存储为 JSON 字符串，UserService 会自动处理序列化和反序列化。

2. **权限验证**:

   - 普通用户路由需要在每个 handler 中调用 `AuthUtils.authenticate()`
   - 管理员路由通过 `api.admin.ts` 中的中间件统一验证

3. **错误处理**:

   - UserService 会抛出错误，需要在路由层捕获并返回适当的响应
   - 使用 `ResponseUtils` 统一错误响应格式

4. **Schema 导入**:
   - 所有用户相关的 Schema 都从 `@/routes/modules/user/schema.user` 导入
   - 不要从 `@/types/openapi-schemas` 导入用户相关的 Schema

## 🎯 最新优化 (2024)

### ✨ 第一阶段：使用 CRUD 工厂 + Transformer（管理员路由）

**api.user-for-admin.ts 重构**：

- 重构前：**175 行代码**
- 重构后：**34 行代码**（减少 80%）
- 关键：添加 `DataTransformer` 支持

### ✨ 第二阶段：添加钩子机制（普通用户路由）⭐ 最新

**api.user.ts 重构**：

- 重构前：**109 行代码**
- 重构后：**30 行代码**（减少 72%）
- 路由风格：改为标准 REST API
- 关键改进：
  1. **扩展 CRUD 工厂**：添加 `CRUDHooks` 支持
  2. **创建 userAuthHook**：统一的身份验证钩子
  3. **标准化路由**：`GET/PUT /api/users/:uid?token=xxx`
  4. **简化代码**：从 109 行减少到 30 行

### 🔑 最佳实践总结

#### 权限验证的两种方案

**方案 1：中间件（适用于所有路由使用相同的验证参数）**

- 使用场景：管理员路由（所有路由都用 `superToken`）
- 实现：在 `api.admin.ts` 中使用 `app.use('/api/admin/*', middleware)`
- 优点：统一验证，代码集中

**方案 2：钩子（适用于每个路由需要不同的验证参数）**

- 使用场景：普通用户路由（每个路由需要不同的 `uid + token`）
- 实现：在 CRUD 工厂配置中使用 `hooks.beforeEach`
- 优点：灵活验证，参数可变

#### 代码行数对比总览

| 模块                  | 重构前     | 重构后    | 减少      |
| --------------------- | ---------- | --------- | --------- |
| api.user-for-admin.ts | 175 行     | 34 行     | **80%** ↓ |
| api.user.ts           | 109 行     | 30 行     | **72%** ↓ |
| **总计**              | **284 行** | **64 行** | **77%** ↓ |

## 🚀 后续优化建议

1. **将 api.user.ts 也改用工厂模式**：需要先添加身份验证钩子支持
2. **添加缓存层**: 对频繁访问的用户配置进行缓存
3. **批量操作**: 支持批量创建、更新、删除用户
4. **用户审计日志**: 记录所有用户配置变更
5. **配置版本控制**: 支持配置历史记录和回滚
6. **用户分组管理**: 支持用户分组和批量配置
