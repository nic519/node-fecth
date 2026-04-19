/**
 * 用户配置相关类型统一出口。
 *
 * 前端组件优先从这里导入用户配置、订阅配置和模板相关类型，
 * 以保持前后端共享类型的一致性。
 */
export type {
	// 地区代码类型。
	AreaCode,
	// API 业务响应码常量类型。
	ResponseCodes,
	// 附加订阅配置类型。
	SubConfig,
	// 系统日志类型。
	SystemLog,
	// 订阅流量信息类型。
	TrafficInfo,
	// 用户配置类型。
	UserConfig,
	// 用户列表响应类型。
	UsersListResponse,
} from './api-schemas';

/**
 * 配置模板相关类型统一出口。
 */
export type {
	ConfigTemplate,
	ConfigTemplateListResponse as ConfigTemplatesResponse,
	ConfigTemplateSaveRequest as CreateConfigTemplateRequest,
	ConfigTemplateCreateResponse as CreateTemplateResponse,
} from './schema.template';
