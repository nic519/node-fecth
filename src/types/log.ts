
export type LogLevel = 'info' | 'warn' | 'error' | 'audit';

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

export type ResourceType = 'user' | 'template' | 'subscription' | 'system';

export interface LogEvent {
  id: string;
  level: LogLevel;
  type: string;
  message: string;
  userId?: string;
  requestId?: string;
  meta?: Record<string, any>;
  createdAt: string;
}

export interface LogQueryParams {
  page?: number;
  pageSize?: number;
  level?: LogLevel;
  type?: string;
  userId?: string;
  startTime?: string;
  endTime?: string;
}
