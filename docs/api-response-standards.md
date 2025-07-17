# API 响应格式规范与最佳实践

## 📋 统一响应格式

### 基础格式
所有 API 响应都必须遵循 `openapi-schemas.ts` 中定义的标准格式：

```typescript
// 基于 BaseResponseSchema
{
  code: number,    // 响应代码：0=成功，其他=错误码
  msg: string,     // 响应消息
  data: any        // 响应数据（可选）
}
```

### 响应代码定义（单一数据源）
```typescript
// 来自 openapi-schemas.ts
export const ResponseCodes = {
  SUCCESS: 0,           // 成功
  INVALID_PARAMS: 400,  // 请求参数错误
  UNAUTHORIZED: 401,    // 未授权
  FORBIDDEN: 403,       // 禁止访问
  NOT_FOUND: 404,       // 资源未找到
  CONFLICT: 409,        // 资源冲突
  INTERNAL_ERROR: 500,  // 服务器内部错误
} as const;
```

## ✅ 正确示例

### 成功响应（符合 SuccessResponseSchema）
```typescript
// 用户列表 - 符合 UsersListResponseSchema
{
  code: 0,
  msg: "获取用户列表成功",
  data: {
    users: [...],
    count: 25,
    timestamp: "2024-01-01T00:00:00Z"
  }
}

// 用户创建 - 符合 SuccessResponseSchema
{
  code: 0,
  msg: "用户创建成功",
  data: {
    message: "用户创建成功",
    uid: "user123"
  }
}
```

### 错误响应（符合 ErrorResponseSchema）
```typescript
// 参数错误
{
  code: 400,
  msg: "用户ID不能为空",
  data: null
}

// 未授权
{
  code: 401,
  msg: "无效的超级管理员令牌",
  data: null
}
```

## ❌ 错误示例（需要避免）

```typescript
// ❌ 使用 success/error 格式
{
  success: true,
  data: {...}
}

// ❌ 使用 success/error 格式
{
  success: false,
  error: "错误信息"
}

// ❌ 直接返回数据
{
  users: [...],
  count: 25
}
```

## 🛠️ 最佳实践

### 1. 使用已定义的 Schema（单一数据源原则）

```typescript
import { ResponseCodes, UserDetailResponseSchema } from '@/types/openapi-schemas';

// ✅ 正确：使用预定义的ResponseCodes
export const getUserDetail = async (c: any) => {
  try {
    const user = await getUser();
    // 这个响应会自动符合 UserDetailResponseSchema
    return c.json({
      code: ResponseCodes.SUCCESS,
      msg: '获取用户详情成功',
      data: {
        config: user.config,
        meta: user.meta
      }
    });
  } catch (error) {
    return c.json({
      code: ResponseCodes.INTERNAL_ERROR,
      msg: '获取用户详情失败',
      data: null
    }, 500);
  }
};
```

### 2. 使用响应验证中间件（基于单一数据源）

```typescript
import { responseValidatorMiddleware } from '@/routes/middleware/responseValidator';

// 在开发环境启用响应格式验证（基于 BaseResponseSchema）
if (process.env.NODE_ENV === 'development') {
  app.use('*', responseValidatorMiddleware());
}
```

### 3. 为特定API使用具体的 Schema

```typescript
// ✅ 使用具体的Schema而不是重新定义
export const adminGetUsersRoute = createRoute({
  // ...
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UsersListResponseSchema, // 来自 openapi-schemas.ts
        },
      },
      description: '用户列表',
    },
    401: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema, // 来自 openapi-schemas.ts
        },
      },
      description: '未授权访问',
    },
  },
});
```

### 4. 使用类型守卫（基于Schema验证）

```typescript
import { ResponseUtils } from '@/utils/responseUtils';

// 在前端检查响应格式（基于实际Schema验证）
const response = await fetch('/api/users');
const data = await response.json();

if (ResponseUtils.isSuccessResponse(data)) {
  // 使用 SuccessResponseSchema.safeParse() 验证
  console.log('成功:', data.data);
} else if (ResponseUtils.isErrorResponse(data)) {
  // 使用 ErrorResponseSchema.safeParse() 验证
  console.error('错误:', data.msg);
}
```

## 🎯 单一数据源原则

### ✅ 正确：使用统一的Schema定义
```typescript
// 所有验证都基于 openapi-schemas.ts
import { 
  BaseResponseSchema, 
  SuccessResponseSchema, 
  ErrorResponseSchema,
  UserDetailResponseSchema 
} from '@/types/openapi-schemas';

// 验证响应格式
const isValid = BaseResponseSchema.safeParse(response).success;
```

### ❌ 错误：重复定义验证规则
```typescript
// 不要重新定义已有的验证逻辑
const validateResponse = (response: any) => {
  return response.code !== undefined && response.msg !== undefined;
};
```

## 🔧 开发工具

### TypeScript 严格检查（基于Schema）
```typescript
// 使用从Schema推导的类型
import type { 
  BaseResponse, 
  SuccessResponse, 
  ErrorResponse,
  UserDetailResponse 
} from '@/types/openapi-schemas';

// 强制所有API函数返回标准格式
export type ApiHandler = (c: any) => Promise<Response>;
```

## 🎯 迁移指南

### 从旧格式迁移到标准格式

```typescript
// 旧格式 ❌
return c.json({
  success: true,
  data: users
});

// 标准格式 ✅（符合 BaseResponseSchema）
return c.json({
  code: ResponseCodes.SUCCESS,
  msg: '获取用户成功',
  data: users
});
```

## 🚨 常见错误

1. **重复定义验证规则** - 应该使用 `openapi-schemas.ts` 中的Schema
2. **忘记设置正确的 HTTP 状态码** - 错误响应应该设置对应的 HTTP 状态码
3. **不使用预定义的ResponseCodes** - 应该使用 `ResponseCodes` 常量
4. **创建自定义Schema** - 应该扩展现有Schema而不是重新创建

## 📊 验证清单

- [ ] 所有 API 响应都符合 `BaseResponseSchema`
- [ ] 使用 `ResponseCodes` 常量而不是硬编码数字
- [ ] 错误响应包含适当的 HTTP 状态码
- [ ] 在开发环境启用基于Schema的响应格式验证
- [ ] 使用具体的响应 Schema（如 `UserDetailResponseSchema`）
- [ ] 前端使用基于Schema的类型守卫检查响应格式
- [ ] 遵循单一数据源原则，不重复定义验证规则

## 🎉 收益

通过遵循这些规范和单一数据源原则，您将获得：

- **类型安全** - 基于Schema的TypeScript类型检查和自动补全
- **API 一致性** - 所有接口遵循统一的Schema定义
- **开发效率** - 减少重复代码和验证逻辑
- **错误预防** - 基于Schema的运行时验证防止格式错误
- **文档自动化** - OpenAPI 自动生成准确的文档
- **维护性** - 单一数据源便于统一修改和维护 