// =============================================================================
// 统一类型导入 - 从后端核心schema导入，确保前后端类型一致性
// =============================================================================

// 从后端核心类型定义导入所有类型
export type {
	AdminLogsResponse,
	// 管理员相关类型
	AdminStats,
	AdminStatsResponse,
	// 基础类型
	AreaCode,
	// API响应类型
	// BaseResponse, // Removed as it was removed from openapi-schemas
	ConfigResponse,
	// 请求类型
	RefreshTrafficResponse,
	ResponseCodes,
	ServiceStatus,
	SubConfig,
	SystemInfo,
	SystemLog,
	// 系统监控类型
	SystemStats,
	TrafficInfo,
	UserConfig,
	UserConfigMeta,
	UsersListResponse,
	UserSummary,
} from './openapi-schemas';

export type {
	IScTemplateModel as ConfigTemplate,
	IScTemplateListResp as ConfigTemplatesResponse,
	IScTemplateCreateReq as CreateConfigTemplateRequest,
	IScTemplateCreateResp as CreateTemplateResponse,
} from './schema.template';

// =============================================================================
// 前端特定的工具类型（如有需要）
// =============================================================================

// 如果需要前端特定的扩展类型，可以在这里添加
// 例如：前端表单状态、UI状态等
