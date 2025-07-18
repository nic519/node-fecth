// ===================================================================
// 🚀 零硬编码 API 模块化导出 (Hono 最佳实践)
// ===================================================================
//
// 此文件基于函数名模式自动生成模块化导出，零硬编码
//
// 🎯 特点：
// - 自动解包装响应，直接返回业务层数据
// - 基于函数名模式自动分组，无硬编码逻辑
// - 支持直接导入和模块化导入两种方式
// - 完全遵循 Hono 轻量级设计理念
//
// ⚠️ 此文件自动生成，请勿手动编辑
//
// 🔄 不要更新此文件，请运行：yarn build:api
//
// ===================================================================

// 导入原始函数（带下划线前缀）
import {
  getHealth as _getHealth,
  postConfigUserUpdateByUid as _postConfigUserUpdateByUid,
  getConfigUserDetailByUid as _getConfigUserDetailByUid,
  adminDeleteUser as _adminDeleteUser,
  adminUserCreate as _adminUserCreate,
  adminGetUsers as _adminGetUsers,
  getStorage as _getStorage,
  getKv as _getKv,
  getByUid as _getByUid
} from './api-client.g';

// 解包装的 getHealth 函数
export const getHealth = async (...args: Parameters<typeof _getHealth>) => {
  const response = await _getHealth(...args);
  return response.data;
};

// 解包装的 postConfigUserUpdateByUid 函数
export const postConfigUserUpdateByUid = async (...args: Parameters<typeof _postConfigUserUpdateByUid>) => {
  const response = await _postConfigUserUpdateByUid(...args);
  return response.data;
};

// 解包装的 getConfigUserDetailByUid 函数
export const getConfigUserDetailByUid = async (...args: Parameters<typeof _getConfigUserDetailByUid>) => {
  const response = await _getConfigUserDetailByUid(...args);
  return response.data;
};

// 解包装的 adminDeleteUser 函数
export const adminDeleteUser = async (...args: Parameters<typeof _adminDeleteUser>) => {
  const response = await _adminDeleteUser(...args);
  return response.data;
};

// 解包装的 adminUserCreate 函数
export const adminUserCreate = async (...args: Parameters<typeof _adminUserCreate>) => {
  const response = await _adminUserCreate(...args);
  return response.data;
};

// 解包装的 adminGetUsers 函数
export const adminGetUsers = async (...args: Parameters<typeof _adminGetUsers>) => {
  const response = await _adminGetUsers(...args);
  return response.data;
};

// 解包装的 getStorage 函数
export const getStorage = async (...args: Parameters<typeof _getStorage>) => {
  const response = await _getStorage(...args);
  return response.data;
};

// 解包装的 getKv 函数
export const getKv = async (...args: Parameters<typeof _getKv>) => {
  const response = await _getKv(...args);
  return response.data;
};

// 解包装的 getByUid 函数
export const getByUid = async (...args: Parameters<typeof _getByUid>) => {
  const response = await _getByUid(...args);
  return response.data;
};

// 模块化组织（可选使用）
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
    adminDeleteUser,
    adminUserCreate,
    adminGetUsers
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
// 方式1：直接使用解包装函数（推荐，直接得到业务数据）
// import { getHealth, adminGetUsers } from '@/generated/api-adapters.g';
// const health = await getHealth(); // 直接得到 { code: 0, msg: "", data: {...} }
// const users = await adminGetUsers(token); // 直接得到 { code: 0, msg: "", data: { users: [...], count: 10, timestamp: "..." } }
//
// 方式2：使用模块化接口
// import { modules } from '@/generated/api-adapters.g';
// const health = await modules.health.getHealth();
// const users = await modules.admin.adminGetUsers(token);
//
// 方式3：向后兼容
// import { adminApi } from '@/generated/api-adapters.g';
// const users = await adminApi.adminGetUsers(token);
//
// 方式4：直接使用原始客户端（如果需要）
// import { getHealth, defaults } from '@/generated/api-client.g';
// const result = await getHealth(); // 得到 { status: 200, data: { code: 0, msg: "", data: {...} } }
//
// ===================================================================
