import { DataTransformer } from '@/db/crud-api-factory';
import { User } from '@/db/schema';
import { IScUserApiModel, IUserConfig } from '@/routes/modules/user/schema.user';

/**
 * 用户数据转换器
 * 处理 config 字段的序列化和反序列化
 */
export const userTransformer: DataTransformer<User, IScUserApiModel> = {
	/**
	 * 从数据库模型转换为 API 模型
	 * 将 config 从 JSON 字符串解析为对象
	 */
	toApi: (dbUser: User): IScUserApiModel => {
		return {
			id: dbUser.id,
			config: JSON.parse(dbUser.config) as IUserConfig,
			accessToken: dbUser.accessToken,
			createdAt: dbUser.createdAt,
			updatedAt: dbUser.updatedAt,
		};
	},

	/**
	 * 从 API 请求转换为数据库模型
	 * 将 config 从对象序列化为 JSON 字符串
	 */
	fromApi: (apiData: any): Partial<User> => {
		const { uid, config } = apiData;

		// 创建操作（包含 uid）
		if (uid) {
			return {
				id: uid,
				config: JSON.stringify(config),
				accessToken: config.accessToken,
			} as Partial<User>;
		}

		// 更新操作（不包含 uid）
		return {
			config: JSON.stringify(config),
			accessToken: config.accessToken,
			updatedAt: new Date().toISOString(),
		} as Partial<User>;
	},
};
