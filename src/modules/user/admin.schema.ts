import type { UserConfig } from './user.schema';

/**
 * 订阅统计信息。
 *
 * 描述管理端用户列表中展示的单个附加订阅源状态。
 */
export interface SubscriptionStat {
	// 订阅源 URL。
	url: string;
	// 订阅来源类型；当前仅统计 appendSubList 中的附加订阅。
	type: 'append';
	// 订阅显示名称，对应 appendSubList 中的 flag。
	name?: string;
	// 数据库中保存的原始流量信息字符串。
	traffic?: string;
	// 动态缓存表记录的最后更新时间。
	lastUpdated?: string;
	// 按最近消耗速度预测的流量耗尽时间（毫秒时间戳）；数据不足时为 null。
	predictedExhaustionAtMs?: number | null;
	// 当前周期的估计消耗速率（字节/天）；数据不足或未在消耗时为 null。
	consumptionRateBytesPerDay?: number | null;
	// 预测置信度：数据点越多、时间跨度越长越可信；无预测时为 null。
	predictionConfidence?: 'low' | 'medium' | 'high' | null;
}

/**
 * 管理端用户配置类型。
 *
 * 在基础用户配置上补充用户 ID、更新时间和订阅统计信息。
 */
export type UserAdminConfig = UserConfig & {
	// 用户唯一标识。
	uid: string;
	// 用户配置最后更新时间。
	updatedAt: string;
	// 用户附加订阅源的统计信息。
	subscriptionStats?: SubscriptionStat[];
};

/**
 * 管理操作日志上下文。
 *
 * 描述管理端创建、更新、删除等操作记录中附带的结构化信息。
 */
export interface AdminOperation {
	// 允许扩展记录额外上下文字段。
	[key: string]: unknown;
	// 操作发生时间。
	timestamp: string;
	// 操作名称。
	operation: string;
	// 被操作的目标用户 ID。
	targetUserId?: string;
	// 执行操作的管理员 ID。
	adminId: string;
	// 操作结果。
	result: 'success' | 'error';
	// 操作详情或错误说明。
	details?: string;
	// 发起操作的客户端 IP。
	ipAddress?: string;
}

/**
 * 配置模板模型。
 *
 * 描述用户模块内部使用的配置模板数据结构。
 */
export interface ConfigTemplate {
	// 模板唯一标识。
	id: string;
	// 模板名称。
	name: string;
	// 模板说明。
	description: string;
	// 模板包含的用户配置片段。
	template: Partial<UserConfig>;
	// 是否为系统默认模板。
	isDefault: boolean;
	// 模板创建时间。
	createdAt: string;
	// 模板最后更新时间。
	updatedAt: string;
	// 模板使用次数。
	usageCount: number;
}
