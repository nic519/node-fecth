
/**
 * 日志等级类型。
 *
 * 用于区分信息、警告、错误和审计类日志。
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'audit';

/**
 * 日志事件类型枚举。
 *
 * 用于标识系统中常见的用户、模板、订阅和系统操作。
 */
export enum LogType {
  // 用户相关
  USER_LOGIN = 'user_login',
  USER_CREATE = 'user_create',
  USER_UPDATE = 'user_update',
  USER_DELETE = 'user_delete',
  
  // 模板相关
  TEMPLATE_CREATE = 'template_create',
  TEMPLATE_UPDATE = 'template_update',
  TEMPLATE_DELETE = 'template_delete',
  
  // 订阅相关
  SUBSCRIPTION_ACCESS = 'subscription_access',
  SUBSCRIPTION_UPDATE = 'subscription_update',
  
  // 系统相关
  SYSTEM_ERROR = 'system_error',
  DB_CLEANUP = 'db_cleanup',
}

/**
 * 日志关联资源类型。
 *
 * 表示日志主要关联的业务资源。
 */
export type ResourceType = 'user' | 'template' | 'subscription' | 'system';

/**
 * 日志事件结构。
 *
 * 描述服务端写入和前端展示时使用的单条日志。
 */
export interface LogEvent {
  // 日志唯一标识。
  id: string;
  // 日志等级。
  level: LogLevel;
  // 日志事件类型。
  type: string;
  // 日志消息正文。
  message: string;
  // 关联用户 ID。
  userId?: string;
  // 请求链路 ID。
  requestId?: string;
  // 附加结构化元数据。
  meta?: Record<string, unknown>;
  // 日志创建时间。
  createdAt: string;
}

/**
 * 日志查询参数结构。
 *
 * 描述管理端日志列表接口支持的筛选和分页参数。
 */
export interface LogQueryParams {
  // 当前页码。
  page?: number;
  // 每页条数。
  pageSize?: number;
  // 日志等级筛选。
  level?: LogLevel;
  // 日志事件类型筛选。
  type?: string;
  // 用户 ID 筛选。
  userId?: string;
  // 开始时间筛选。
  startTime?: string;
  // 结束时间筛选。
  endTime?: string;
}
