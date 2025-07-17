// ===================================================================
// 🚀 零硬编码 API 模块化导出 (Hono 最佳实践)
// ===================================================================
//
// 此文件基于函数名模式自动生成模块化导出，零硬编码
//
// 🎯 特点：
// - 直接重新导出原始函数，保持完整类型信息
// - 基于函数名模式自动分组，无硬编码逻辑
// - 支持直接导入和模块化导入两种方式
// - 完全遵循 Hono 轻量级设计理念
//
// ⚠️  此文件自动生成，请勿手动编辑
//
// 🔄 要更新此文件，请运行：yarn generate:api
//
// ===================================================================

// 重新导出所有原始函数（推荐直接使用）
export {
  getHealth,
  postConfigUserUpdateByUid,
  getConfigUserDetailByUid,
  getAdminUserDeleteByUid,
  postAdminUserCreate,
  getAdminUserAll,
  getStorage,
  getKv,
  getByUid
} from './api-client';

// 模块化组织（可选使用）
import {
  getHealth,
  postConfigUserUpdateByUid,
  getConfigUserDetailByUid,
  getAdminUserDeleteByUid,
  postAdminUserCreate,
  getAdminUserAll,
  getStorage,
  getKv,
  getByUid
} from './api-client';

export const modules = {
  // health 模块 (1 个函数)
  health: {
    getHealth
  },

  // userConfig 模块 (2 个函数)
  userConfig: {
    postConfigUserUpdateByUid,
    getConfigUserDetailByUid
  },

  // admin 模块 (3 个函数)
  admin: {
    getAdminUserDeleteByUid,
    postAdminUserCreate,
    getAdminUserAll
  },

  // storage 模块 (2 个函数)
  storage: {
    getStorage,
    getKv
  },

  // subscription 模块 (1 个函数)
  subscription: {
    getByUid
  }
};

// 向后兼容的导出
export const healthApi = modules.health;
export const userConfigApi = modules.userConfig;
export const adminApi = modules.admin;
export const storageApi = modules.storage;
export const subscriptionApi = modules.subscription;

// 默认导出模块集合
export default modules;

// ===================================================================
// 使用示例
// ===================================================================
//
// 方式1：直接使用原始函数（推荐，完整类型支持）
// import { getHealth, getAdminUserAll } from '@/generated/api-adapters';
// const health = await getHealth();
// const users = await getAdminUserAll(token);
//
// 方式2：使用模块化接口
// import { modules } from '@/generated/api-adapters';
// const health = await modules.health.getHealth();
// const users = await modules.admin.getAdminUserAll(token);
//
// 方式3：向后兼容
// import { adminApi } from '@/generated/api-adapters';
// const users = await adminApi.getAdminUserAll(token);
//
// ===================================================================
