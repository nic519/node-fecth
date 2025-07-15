// 地区代码类型
export type AreaCode = 'TW' | 'SG' | 'JP' | 'VN' | 'HK' | 'US';

// 订阅配置类型
export interface SubConfig {
  subscribe: string;
  flag: string;
  includeArea?: AreaCode[];
}

// 用户配置类型
export interface UserConfig {
  subscribe: string;
  accessToken: string;
  ruleUrl?: string;
  fileName?: string;
  multiPortMode?: AreaCode[];
  appendSubList?: SubConfig[];
  excludeRegex?: string;
}

// 配置元数据
export interface UserConfigMeta {
  lastModified: string;
  source: 'kv' | 'env';
  userId: string;
}

// API 响应类型
export interface ConfigResponse {
  config: UserConfig;
  meta: UserConfigMeta;
}

// 管理员统计数据类型
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  todayRequests: number;
  systemStatus: string;
  totalTraffic: string;
  todayTraffic: string;
  serverNodes: number;
  uptime: string;
}

// 流量使用信息
export interface TrafficInfo {
  upload: number;
  download: number;
  total: number;
  used: number;
  remaining: number;
  expire?: number;
  isExpired: boolean;
  usagePercent: number;
}

// 用户摘要信息（管理员视图）
export interface UserSummary {
  userId: string;
  token: string;
  hasConfig: boolean;
  source: 'kv' | 'env' | 'none';
  lastModified: string | null;
  isActive: boolean;
  subscribeUrl?: string;
  status: 'active' | 'inactive' | 'disabled';
  trafficInfo?: TrafficInfo;
}

// 系统监控数据类型
export interface SystemStats {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

// 系统信息类型
export interface SystemInfo {
  os: string;
  uptime: string;
  totalMemory: string;
  availableMemory: string;
  totalDisk: string;
  availableDisk: string;
}

// 服务状态类型
export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error' | 'pending';
  description?: string;
}

// 系统日志类型
export interface SystemLog {
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

// 配置模板类型
export interface ConfigTemplate {
  id: number;
  name: string;
  description: string;
  type: 'clash' | 'v2ray' | 'shadowsocks';
  lastModified: string;
  isActive: boolean;
  usageCount: number;
  version: string;
  content?: string;
}

// API 错误响应类型
export interface ApiError {
  error: string;
  message?: string;
  code?: number;
} 