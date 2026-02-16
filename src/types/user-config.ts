// =============================================================================
// 统一类型导入 - 从后端核心schema导入，确保前后端类型一致性
// =============================================================================

// 从后端核心类型定义导入所有类型
export type {
	AdminLogsResponse,
	// 基础类型
	AreaCode,
	// API响应类型
	// BaseResponse, // Removed as it was removed from openapi-schemas
	ConfigResponse,
	// 请求类型
	RefreshTrafficResponse,
	ResponseCodes,
	SubConfig,
	SystemLog,
	TrafficInfo,
	UserConfig,
	UsersListResponse,
} from './openapi-schemas';

export type {
	IScTemplateModel as ConfigTemplate,
	IScTemplateListResp as ConfigTemplatesResponse,
	IScTemplateCreateReq as CreateConfigTemplateRequest,
	IScTemplateCreateResp as CreateTemplateResponse,
} from './schema.template';

