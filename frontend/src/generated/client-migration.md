# API客户端迁移指南

## 🎯 概述

本指南帮助您从手写的 `@/api/client.ts` 迁移到自动生成的 `@/generated/api-client.ts`。

## 📋 主要变化

### 路径更新
| 功能 | 原路径 | 新路径 | 说明 |
|------|--------|--------|------|
| 获取用户配置 | `config/users/${uid}` | `config/user/detail/${uid}` | 标准化路径 |
| 更新用户配置 | `config/users/${uid}` | `config/user/update/${uid}` | 分离读写操作 |
| 管理员获取用户 | `admin/users` | `admin/user/all` | 标准化路径 |
| 管理员创建用户 | `create/user` | `admin/user/create` | 统一管理员前缀 |

### API方法变化

#### userConfigApi
```typescript
// 原方法
userConfigApi.get(uid, token)           // ❌ 已移除
userConfigApi.update(uid, config, token) // ✅ 保持不变
userConfigApi.delete(uid, token)        // ✅ 保持不变

// 新方法
userConfigApi.getDetail(uid, token)     // ✅ 新增，替代 get
```

#### adminApi
```typescript
// 原方法
adminApi.getUsers(superToken)                    // ❌ 已重命名
adminApi.getUserDetail(uid, superToken)          // ❌ 已移除 
adminApi.updateUser(uid, config, superToken)     // ❌ 已移除
adminApi.createUser(uid, config, superToken)     // ✅ 保持不变
adminApi.deleteUser(uid, superToken)             // ✅ 保持不变
adminApi.getStats(superToken)                    // ✅ 保持不变
adminApi.refreshUserTraffic(uid, superToken)     // ❌ 已移除

// 新方法
adminApi.getAllUsers(superToken)                 // ✅ 新增，替代 getUsers
```

## 🔄 迁移步骤

### 1. 更新导入语句
```typescript
// 原导入
import { userConfigApi, adminApi } from '@/api/client';

// 新导入
import { userConfigApi, adminApi } from '@/generated/api-client';
```

### 2. 更新方法调用

#### 获取用户配置
```typescript
// 原代码
const config = await userConfigApi.get(uid, token);

// 新代码
const config = await userConfigApi.getDetail(uid, token);
```

#### 获取用户列表
```typescript
// 原代码
const users = await adminApi.getUsers(superToken);

// 新代码
const users = await adminApi.getAllUsers(superToken);
```

## 🛠️ 兼容性层

如果需要渐进式迁移，可以创建一个兼容性层：

```typescript
// compatibility-layer.ts
import { 
  userConfigApi as generatedUserApi, 
  adminApi as generatedAdminApi 
} from '@/generated/api-client';

export const userConfigApi = {
  // 保持向后兼容
  get: generatedUserApi.getDetail,
  getDetail: generatedUserApi.getDetail,
  update: generatedUserApi.update,
  delete: generatedUserApi.delete,
};

export const adminApi = {
  // 保持向后兼容
  getUsers: generatedAdminApi.getAllUsers,
  getAllUsers: generatedAdminApi.getAllUsers,
  createUser: generatedAdminApi.createUser,
  deleteUser: generatedAdminApi.deleteUser,
  getStats: generatedAdminApi.getStats,
  
  // 不再支持的方法，返回错误提示
  getUserDetail: () => {
    throw new Error('getUserDetail 已废弃，请使用 userConfigApi.getDetail');
  },
  updateUser: () => {
    throw new Error('updateUser 已废弃，请使用 userConfigApi.update');
  },
  refreshUserTraffic: () => {
    throw new Error('refreshUserTraffic 暂不支持，等待后端实现');
  },
};
```

## ✅ 验证清单

迁移完成后，请检查：

- [ ] 所有导入语句已更新
- [ ] `userConfigApi.get` 已替换为 `userConfigApi.getDetail`  
- [ ] `adminApi.getUsers` 已替换为 `adminApi.getAllUsers`
- [ ] 移除了对 `adminApi.getUserDetail` 的调用
- [ ] 移除了对 `adminApi.updateUser` 的调用
- [ ] 移除了对 `adminApi.refreshUserTraffic` 的调用
- [ ] 类型定义正常工作
- [ ] 所有API调用正常响应

## 🚀 优势

迁移到自动生成的客户端后，您将获得：

1. **类型安全**: 基于OpenAPI规范的完整类型定义
2. **自动同步**: 后端API变化时自动更新客户端
3. **标准化**: 统一的API路径和命名规范
4. **维护性**: 减少手动维护API客户端的工作
5. **文档化**: 自动生成的API文档

## 📚 相关文档

- [OpenAPI规范文档](../../src/routes/openapi/)
- [后端路由模块](../../src/routes/modules/)
- [类型定义](./api-types.ts) 