// =============================================================================
// 统一类型导入 - 从后端核心schema导入，确保前后端类型一致性
// =============================================================================

// 从后端核心类型定义导入所有类型
export type {
  // 基础类型
  AreaCode,
  SubConfig,
  UserConfig,
  UserConfigMeta,
  ConfigResponse,
  
  // 管理员相关类型
  AdminStats,
  TrafficInfo,
  UserSummary,
  
  // 系统监控类型
  SystemStats,
  SystemInfo,
  ServiceStatus,
  SystemLog,
  
  // 配置模板类型
  ConfigTemplate,
  
  // API响应类型
  ErrorResponse as ApiError,
  SuccessResponse,
  UsersListResponse,
  
  // 请求类型
  CreateUserRequest,
  UpdateUserConfigRequest,
  CreateConfigTemplateRequest
} from '../../../src/types/openapi-schemas';

// =============================================================================
// 前端特定的工具类型（如有需要）
// =============================================================================

// 如果需要前端特定的扩展类型，可以在这里添加
// 例如：前端表单状态、UI状态等 