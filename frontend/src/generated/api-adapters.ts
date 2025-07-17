// ===================================================================
// 🚀 自动生成的 API 适配器
// ===================================================================
//
// 此文件由 generate-api-client.ts 自动生成
// 基于 OpenAPI 规范自动创建适配器，确保与最新 API 同步
//
// ⚠️  警告：请勿手动编辑此文件，所有更改将在下次生成时丢失
//
// 🔄 要更新此文件，请运行：yarn generate-api
//
// ===================================================================

import {
  getAdminUserDeleteByUid,
  postAdminUserCreate,
  getAdminUserAll,
  postConfigUserUpdateByUid,
  getConfigUserDetailByUid,
  getHealth
} from './api-client';

// 管理员API适配器
export const adminApi = {
  // 获取所有用户
  async getAllUsers(superToken: string) {
    const response = await getAdminUserAll(superToken);
    return handleResponse(response);
  },

  // 删除用户
  async deleteUser(uid: string, superToken: string) {
    const response = await getAdminUserDeleteByUid(uid, superToken);
    return handleResponse(response);
  },

  // 创建用户
  async createUser(uid: string, userConfig: any, _superToken: string) {
    const response = await postAdminUserCreate(_superToken, {
      uid,
      config: userConfig
    });  
    return handleResponse(response);
  },

  // 获取统计数据 (使用健康检查作为回退)
  async getStats(_superToken: string) {
    // 注意: 如果有专门的统计接口，请在 OpenAPI 规范中添加
    try {
      const response = await getHealth();
      if (response.status === 200) {
        return generateDefaultStats();
      }
      throw new Error(`Health check failed: ${response.status}`);
    } catch (error) {
      console.warn('Health check failed, returning default stats:', error);
      return generateDefaultStats();
    }
  }
};

// 用户配置API适配器  
export const userConfigApi = {
  // 获取用户详情
  async getDetail(uid: string, token: string) {
    const response = await getConfigUserDetailByUid(uid, token);
    return handleResponse(response);
  },

  // 更新用户配置
  async update(uid: string, config: any, token: string) {
    const response = await postConfigUserUpdateByUid(uid, token, { config });
    return handleResponse(response);
  }
};

// 健康检查API
export const healthApi = {
  // 健康检查
  async check() {
    const response = await getHealth();
    return handleResponse(response);
  }
};

// ===================================================================
// 响应处理工具函数
// ===================================================================

/**
 * 统一处理API响应
 */
function handleResponse<T>(response: { status: number; data: T }): T {
  if (response.status >= 200 && response.status < 300) {
    return response.data;
  }
  throw new Error(`API Error: ${response.status}`);
}

/**
 * 生成默认统计数据（当真实接口不存在时使用）
 */
function generateDefaultStats() {
  return {
    code: 0,
    msg: 'success',
    data: {
      totalUsers: 0,
      activeUsers: 0,
      todayRequests: 0,
      systemStatus: 'healthy',
      totalTraffic: '0 MB',
      todayTraffic: '0 MB',
      serverNodes: 1,
      uptime: '0h 0m'
    }
  };
}
