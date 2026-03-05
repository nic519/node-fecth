// =============================================================================
// 统一 Schema 导出
// 整合所有子模块的 Schema 定义，作为项目的单一真理源 (Single Source of Truth)
// =============================================================================

// 基础 Schema 和响应码
export * from './schema/common';

// 认证相关 Schema (注册等)
export * from './schema/auth';

// 动态同步相关 Schema
export * from './schema/dynamic';

// 管理员相关 Schema (用户管理、日志查询)
export * from './schema/admin';

// 用户响应相关 Schema
export * from './schema/user-response';

// 从用户模块导出用户相关类型 (保持兼容性)
export {
	AreaCodeSchema,
	SubscribeSchema as SubConfigSchema,
	UserConfigSchema,
	type IUserConfig as UserConfig,
	type TrafficInfo,
} from '@/modules/user/user.schema';

import { z } from 'zod';
import { AreaCodeSchema, SubscribeSchema } from '@/modules/user/user.schema';
import { IUserConfig } from '@/modules/user/user.schema';

// 导出基础类型的 TypeScript 定义
export type AreaCode = z.infer<typeof AreaCodeSchema>;
export type SubConfig = z.infer<typeof SubscribeSchema>;

// 导出用户配置响应类型 (别名)
export type ConfigResponse = IUserConfig;
