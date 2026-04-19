import { z } from 'zod';
import { AREA_CODES } from '@/config/proxy-area.config';

/**
 * 地区代码 Schema。
 *
 * 约束系统支持的代理地区标识，取值来自代理地区配置。
 */
export const AreaCodeSchema = z.enum(AREA_CODES);

/**
 * 附加订阅配置 Schema。
 *
 * 描述用户额外追加的订阅源、显示标识和可选地区过滤范围。
 */
export const SubscribeSchema = z.object({
	// 订阅源 URL。
	subscribe: z.url('订阅链接必须是有效的URL'),
	// 订阅源在界面和规则处理中的短标识。
	flag: z.string().min(1, '标识不能为空'),
	// 该订阅源只参与哪些地区的节点合并；为空时表示不限制地区。
	includeArea: z.array(AreaCodeSchema).optional(),
});

/**
 * 用户配置 Schema。
 *
 * 描述用户可保存和更新的完整订阅配置，是用户配置相关逻辑的核心结构。
 */
export const UserConfigSchema = z.object({
	// 用户访问订阅接口时使用的访问令牌。
	accessToken: z.string().min(1, '访问令牌不能为空'),
	// 远程规则配置地址；允许为空字符串表示不启用远程规则。
	ruleUrl: z.union([z.string().url(), z.literal('')]).optional(),
	// 必须保留的节点过滤表达式。
	requiredFilters: z.string().optional(),
	// 导出的配置文件名称。
	fileName: z.string().optional(),
	// 多端口模式启用的地区列表。
	multiPortMode: z.array(AreaCodeSchema).optional(),
	// 用户额外追加的订阅源列表。
	appendSubList: z.array(SubscribeSchema).optional(),
	// 需要排除的节点正则表达式。
	excludeRegex: z.string().optional(),
	// 用户自定义的规则覆写内容。
	ruleOverwrite: z.string().optional(),
	// 用户配置最后更新时间，使用 ISO 日期时间字符串。
	updatedAt: z.string().datetime().optional(),
});

/**
 * 数据库存储的动态用户配置 Schema。
 *
 * 移除了已经作为独立字段存储的用户配置项，只保留动态同步逻辑需要的配置片段。
 */
export const DynamicUserConfigSchema = UserConfigSchema.omit({
	accessToken: true,
	requiredFilters: true,
	ruleUrl: true,
	fileName: true,
	appendSubList: true,
	ruleOverwrite: true,
});

/**
 * 订阅接口查询参数 Schema。
 *
 * 用于校验订阅下载接口 URL 上的可选查询参数。
 */
export const SubscribeParamsSchema = z.object({
	// 是否触发下载行为的标记参数。
	download: z.string().optional(),
	// 指定本次订阅处理使用的标识。
	flag: z.string().optional(),
	// 指定下载时返回的文件名。
	filename: z.string().optional(),
});

/**
 * 用户配置更新请求 Schema。
 *
 * 用于用户侧更新自身配置的请求体校验。
 */
export const UserConfigUpdateRequestSchema = z.object({
	// 新的完整用户配置。
	config: UserConfigSchema,
});

/**
 * 用户配置类型。
 *
 * 由 UserConfigSchema 推导而来，确保运行时校验和 TypeScript 类型保持一致。
 */
export type UserConfig = z.infer<typeof UserConfigSchema>;

/**
 * 订阅流量信息 Schema。
 *
 * 描述从订阅响应头或缓存中解析出的用量、总量和过期状态。
 */
export const TrafficInfoSchema = z.object({
	// 已上传流量，单位由解析来源决定。
	upload: z.number(),
	// 已下载流量，单位由解析来源决定。
	download: z.number(),
	// 总流量额度。
	total: z.number(),
	// 已使用流量。
	used: z.number(),
	// 剩余流量。
	remaining: z.number(),
	// 过期时间戳；不存在时表示未提供过期信息。
	expire: z.number().optional(),
	// 当前订阅是否已经过期。
	isExpired: z.boolean(),
	// 已使用流量百分比。
	usagePercent: z.number(),
});

/**
 * 订阅流量信息类型。
 *
 * 由 TrafficInfoSchema 推导而来。
 */
export type TrafficInfo = z.infer<typeof TrafficInfoSchema>;
