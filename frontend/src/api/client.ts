import ky from 'ky';
import type { ConfigResponse, UserConfig, AdminStats, UserSummary } from '@/types/user-config';

// 环境配置
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.DEV ? 'http://localhost:8787/api' : '/api'),
  isDev: import.meta.env.DEV
};

// 创建 API 客户端实例
const apiClient = ky.create({
  prefixUrl: config.apiBaseUrl,
  timeout: 30000,
  retry: {
    limit: 2,
    methods: ['get']
  },
  hooks: {
    beforeError: [
      error => {
        const { response } = error;
        if (response && response.body) {
          // 尝试解析错误响应
          error.name = 'ApiError';
          error.message = `请求失败: ${response.status} ${response.statusText}`;
        }
        return error;
      }
    ]
  }
});

// 用户配置 API
export const userConfigApi = {
  /**
   * 获取用户配置
   */
  async get(userId: string, token: string): Promise<ConfigResponse> {
    return apiClient.get(`config/users/${userId}`, {
      searchParams: { token }
    }).json<ConfigResponse>();
  },

  /**
   * 更新用户配置
   */
  async update(userId: string, config: UserConfig, token: string): Promise<void> {
    await apiClient.post(`config/users/${userId}`, {
      json: { config },
      searchParams: { token }
    });
  },

  /**
   * 删除用户配置
   */
  async delete(userId: string, token: string): Promise<void> {
    await apiClient.delete(`config/users/${userId}`, {
      searchParams: { token }
    });
  }
};

// 管理员 API
export const adminApi = {
  /**
   * 获取系统统计数据
   */
  async getStats(superToken: string): Promise<AdminStats> {
    return apiClient.get('admin/stats', {
      searchParams: { superToken }
    }).json<AdminStats>();
  },

  /**
   * 获取用户列表
   */
  async getUsers(superToken: string): Promise<UserSummary[]> {
    return apiClient.get('admin/users', {
      searchParams: { superToken }
    }).json<UserSummary[]>();
  },

  /**
   * 获取用户详情
   */
  async getUserDetail(userId: string, superToken: string): Promise<ConfigResponse> {
    return apiClient.get(`admin/users/${userId}`, {
      searchParams: { superToken }
    }).json<ConfigResponse>();
  },

  /**
   * 更新用户配置（管理员）
   */
  async updateUser(userId: string, config: UserConfig, superToken: string): Promise<void> {
    await apiClient.put(`admin/users/${userId}`, {
      json: { config },
      searchParams: { superToken }
    });
  },

  /**
   * 删除用户（管理员）
   */
  async deleteUser(userId: string, superToken: string): Promise<void> {
    await apiClient.delete(`admin/users/${userId}`, {
      searchParams: { superToken }
    });
  },

  /**
   * 创建用户（管理员）
   */
  async createUser(userId: string, config: UserConfig, superToken: string): Promise<void> {
    await apiClient.post('admin/users', {
      json: { userId, config },
      searchParams: { superToken }
    });
  },

  /**
   * 刷新用户流量信息
   */
  async refreshUserTraffic(userId: string, superToken: string): Promise<any> {
    return apiClient.post(`admin/users/${userId}/traffic/refresh`, {
      searchParams: { superToken }
    }).json();
  }
};

// 导出配置，供其他模块使用
export { config }; 