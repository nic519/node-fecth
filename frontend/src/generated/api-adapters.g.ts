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
// 🔄 不要更新此文件，请运行：bun run build:api
//
// ===================================================================

// 导入原始函数（带下划线前缀）
import {
  getApiHealth as _getApiHealth,
  getUser as _getUser,
  updateUser as _updateUser,
  getApiX as _getApiX,
  getApiAdminTemplates as _getApiAdminTemplates,
  postApiAdminTemplates as _postApiAdminTemplates,
  putApiAdminTemplatesByTemplateId as _putApiAdminTemplatesByTemplateId,
  deleteApiAdminTemplatesByTemplateId as _deleteApiAdminTemplatesByTemplateId,
  adminGetUsers as _adminGetUsers,
  adminUserCreate as _adminUserCreate,
  adminGetUser as _adminGetUser,
  adminUserUpdate as _adminUserUpdate,
  adminDeleteUser as _adminDeleteUser
} from './api-client.g';

// 解包装的 getApiHealth 函数
export const getApiHealth = async (...args: Parameters<typeof _getApiHealth>) => {
  const response = await _getApiHealth(...args);
  return response.data;
};

// 解包装的 getUser 函数
export const getUser = async (...args: Parameters<typeof _getUser>) => {
  const response = await _getUser(...args);
  return response.data;
};

// 解包装的 updateUser 函数
export const updateUser = async (...args: Parameters<typeof _updateUser>) => {
  const response = await _updateUser(...args);
  return response.data;
};

// 解包装的 getApiX 函数
export const getApiX = async (...args: Parameters<typeof _getApiX>) => {
  const response = await _getApiX(...args);
  return response.data;
};

// 解包装的 getApiAdminTemplates 函数
export const getApiAdminTemplates = async (...args: Parameters<typeof _getApiAdminTemplates>) => {
  const response = await _getApiAdminTemplates(...args);
  return response.data;
};

// 解包装的 postApiAdminTemplates 函数
export const postApiAdminTemplates = async (...args: Parameters<typeof _postApiAdminTemplates>) => {
  const response = await _postApiAdminTemplates(...args);
  return response.data;
};

// 解包装的 putApiAdminTemplatesByTemplateId 函数
export const putApiAdminTemplatesByTemplateId = async (...args: Parameters<typeof _putApiAdminTemplatesByTemplateId>) => {
  const response = await _putApiAdminTemplatesByTemplateId(...args);
  return response.data;
};

// 解包装的 deleteApiAdminTemplatesByTemplateId 函数
export const deleteApiAdminTemplatesByTemplateId = async (...args: Parameters<typeof _deleteApiAdminTemplatesByTemplateId>) => {
  const response = await _deleteApiAdminTemplatesByTemplateId(...args);
  return response.data;
};

// 解包装的 adminGetUsers 函数
export const adminGetUsers = async (...args: Parameters<typeof _adminGetUsers>) => {
  const response = await _adminGetUsers(...args);
  return response.data;
};

// 解包装的 adminUserCreate 函数
export const adminUserCreate = async (...args: Parameters<typeof _adminUserCreate>) => {
  const response = await _adminUserCreate(...args);
  return response.data;
};

// 解包装的 adminGetUser 函数
export const adminGetUser = async (...args: Parameters<typeof _adminGetUser>) => {
  const response = await _adminGetUser(...args);
  return response.data;
};

// 解包装的 adminUserUpdate 函数
export const adminUserUpdate = async (...args: Parameters<typeof _adminUserUpdate>) => {
  const response = await _adminUserUpdate(...args);
  return response.data;
};

// 解包装的 adminDeleteUser 函数
export const adminDeleteUser = async (...args: Parameters<typeof _adminDeleteUser>) => {
  const response = await _adminDeleteUser(...args);
  return response.data;
};

// 模块化组织（可选使用）
export const modules = {
  // health 模块 (1 个函数)
  health: {
    getApiHealth
  },

  // general 模块 (3 个函数)
  general: {
    getUser,
    updateUser,
    getApiX
  },

  // admin 模块 (9 个函数)
  admin: {
    getApiAdminTemplates,
    postApiAdminTemplates,
    putApiAdminTemplatesByTemplateId,
    deleteApiAdminTemplatesByTemplateId,
    adminGetUsers,
    adminUserCreate,
    adminGetUser,
    adminUserUpdate,
    adminDeleteUser
  }
};

// 向后兼容的导出
export const healthApi = modules.health;
export const generalApi = modules.general;
export const adminApi = modules.admin;

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
