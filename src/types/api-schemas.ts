import { z } from 'zod';
import {
	AreaCodeSchema,
	SubscribeSchema,
	type UserConfig,
} from '@/modules/user/user.schema';

/**
 * API Schema 统一出口。
 *
 * 用于集中导出 Next.js Route Handler、服务层和前端请求代码共享的
 * Zod 校验结构与 TypeScript 类型。这里不再表示 OpenAPI 文档生成链路，
 * 只承担项目内部 API 契约的单一导出入口。
 */

// 基础响应结构、响应码和通用日志类型。
export * from './schema/common';

// 认证相关请求结构，例如用户注册。
export * from './schema/auth';

// 动态订阅同步与缓存相关结构。
export * from './schema/dynamic';

// 管理端查询和管理接口相关结构。
export * from './schema/admin';

// 用户相关响应结构。
export * from './schema/user-response';

// 用户配置相关结构从用户模块集中透出，方便调用方统一导入。
export {
	AreaCodeSchema,
	SubscribeSchema as SubConfigSchema,
	UserConfigSchema,
	type UserConfig,
	type TrafficInfo,
} from '@/modules/user/user.schema';

/**
 * 地区代码类型。
 *
 * 表示可用于代理分组、多端口模式和订阅过滤的地区标识。
 */
export type AreaCode = z.infer<typeof AreaCodeSchema>;

/**
 * 附加订阅配置类型。
 *
 * 表示用户手动追加的单个订阅源及其过滤设置。
 */
export type SubConfig = z.infer<typeof SubscribeSchema>;

/**
 * 已通过鉴权的用户配置类型。
 *
 * 主要用于中间件和服务端鉴权函数返回值；命名强调它是用户配置本身，
 * 不是包裹了 code/msg/data 的通用 API 响应。
 */
export type AuthenticatedUserConfig = UserConfig;
