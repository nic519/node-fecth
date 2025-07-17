# 🚀 API 客户端迁移指南

## 重大变更
从硬编码API客户端迁移到**完全动态生成**的客户端。新的客户端基于 OpenAPI 规范自动生成所有方法，支持新增接口自动包含。

## 🎯 核心优势
- ✅ **完全动态** - 基于 OpenAPI 规范自动生成所有 API 方法
- ✅ **新增接口自动包含** - 后端添加新接口时自动生成，无需手动维护
- ✅ **类型安全** - 所有方法都有完整的 TypeScript 类型
- ✅ **零维护成本** - 不需要手动编写或维护任何 API 方法

## 🔄 API 方法映射

### 原来的分组API → 新的动态生成方法

| 旧方法 | 新方法 | 说明 |
|--------|--------|------|
| `userConfigApi.update(uid, config, token)` | `postConfigUserUpdateByUid(uid, token, { config })` | 参数顺序调整 |
| `userConfigApi.getDetail(uid, token)` | `getConfigUserDetailByUid(uid, token)` | 方法名更明确 |
| `adminApi.getAllUsers(superToken)` | `getAdminUserAll(superToken)` | 直接映射 |
| `adminApi.createUser(body)` | `postAdminUserCreate(body)` | 直接映射 |
| `adminApi.deleteUser(uid, superToken)` | `getAdminUserDeleteByUid(uid, superToken)` | 方法名更明确 |
| `healthApi.check()` | `getHealth()` | 简化名称 |
| `storageApi.operation(params)` | `getStorage(params)` | 直接映射 |
| `kvApi.operation(params)` | `getKv(params)` | 参数结构调整 |
| `subscriptionApi.getConfig(uid, token, options)` | `getUid(uid, token, options)` | 参数结构调整 |

## 📝 响应格式变更

### 旧格式（包装过的）
```typescript
const response = await userConfigApi.getDetail(uid, token);
// response 直接是数据: { code: 0, msg: string, data: {...} }
if (response.code === 0) {
  // 使用 response.data
}
```

### 新格式（oazapfts 原生）
```typescript
const response = await getConfigUserDetailByUid(uid, token);
// response 是包装格式: { status: 200, data: { code: 0, msg: string, data: {...} } }
if (response.status === 200) {
  // 使用 response.data 获取实际数据
  const actualData = response.data; // { code: 0, msg: string, data: {...} }
}
```

## 🛠️ 配置方法

### 设置基础URL
```typescript
import { defaults } from '@/generated/api-client';
defaults.baseUrl = 'https://api.example.com';
```

### 设置认证
```typescript
import { defaults } from '@/generated/api-client';
defaults.headers.Authorization = 'Bearer your-token';
```

### 全局配置
```typescript
import { defaults } from '@/generated/api-client';
Object.assign(defaults, {
  baseUrl: 'https://api.example.com',
  headers: {
    Authorization: 'Bearer your-token',
    'Custom-Header': 'value'
  }
});
```

## 📋 迁移步骤

### 1. 更新导入
```typescript
// 旧方式
import { userConfigApi, adminApi } from '@/generated/api-client';

// 新方式
import { 
  getConfigUserDetailByUid, 
  postConfigUserUpdateByUid,
  getAdminUserAll,
  defaults 
} from '@/generated/api-client';
```

### 2. 更新方法调用
```typescript
// 旧方式
const response = await userConfigApi.getDetail(uid, token);

// 新方式  
const response = await getConfigUserDetailByUid(uid, token);
```

### 3. 更新响应处理
```typescript
// 旧方式
if (response.code === 0) {
  setUsers(response.data.users);
}

// 新方式
if (response.status === 200) {
  const { code, data } = response.data;
  if (code === 0) {
    setUsers(data.users);
  }
}
```

## 🎉 迁移完成后的优势

1. **自动同步** - 后端新增接口时，重新运行 `yarn generate:api` 即可自动包含
2. **类型安全** - 所有API调用都有完整的TypeScript类型检查
3. **方法发现** - IDE可以自动提示所有可用的API方法
4. **零维护** - 不需要手动维护任何API客户端代码

## 🔍 查看可用方法

生成的API客户端包含以下动态生成的方法：
- `getHealth()` - 健康检查
- `postConfigUserUpdateByUid()` - 更新用户配置
- `getConfigUserDetailByUid()` - 获取用户详情
- `getAdminUserDeleteByUid()` - 删除用户（管理员）
- `postAdminUserCreate()` - 创建用户（管理员）
- `getAdminUserAll()` - 获取所有用户（管理员）
- `getStorage()` - 存储操作
- `getKv()` - KV存储操作
- `getUid()` - 获取订阅配置

> 💡 **提示**: 当后端添加新的API接口时，这个列表会自动更新！ 