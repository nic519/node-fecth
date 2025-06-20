import { z } from 'zod';

// 地区代码验证schema
export const AreaCodeSchema = z.enum(['TW', 'SG', 'JP', 'VN', 'HK', 'US']);

// 订阅配置验证schema
export const SubConfigSchema = z.object({
	subscribe: z.string().url('订阅链接必须是有效的URL'),
	flag: z.string().min(1, '标识不能为空'),
	includeArea: z.array(AreaCodeSchema).optional(),
});

// 用户配置验证schema
export const UserConfigSchema = z.object({
	subscribe: z.string().url('订阅地址必须是有效的URL'),
	accessToken: z.string().min(1, '访问令牌不能为空'),
	ruleUrl: z.string().url('规则模板链接必须是有效的URL').optional(),
	fileName: z.string().optional(),
	multiPortMode: z.array(AreaCodeSchema).optional(),
	appendSubList: z.array(SubConfigSchema).optional(),
	excludeRegex: z.string().optional(),
});

// 导出类型（从schema推断）
export type UserConfig = z.infer<typeof UserConfigSchema>;
export type SubConfig = z.infer<typeof SubConfigSchema>;
export type AreaCode = z.infer<typeof AreaCodeSchema>;

// 验证函数
export function validateUserConfig(data: unknown): { isValid: boolean; errors: string[] } {
	const result = UserConfigSchema.strict().safeParse(data);

	if (result.success) {
		return { isValid: true, errors: [] };
	} else {
		const errors = result.error.errors.map((err) => {
			const path = err.path.length > 0 ? err.path.join('.') : 'root';
			return `${path}: ${err.message}`;
		});
		return { isValid: false, errors };
	}
}

// 严格验证函数（不允许额外字段）
export function validateUserConfigStrict(data: unknown): { isValid: boolean; errors: string[] } {
	const result = UserConfigSchema.strict().safeParse(data);

	if (result.success) {
		return { isValid: true, errors: [] };
	} else {
		const errors = result.error.errors.map((err) => {
			const path = err.path.length > 0 ? err.path.join('.') : 'root';
			return `${path}: ${err.message}`;
		});
		return { isValid: false, errors };
	}
}
