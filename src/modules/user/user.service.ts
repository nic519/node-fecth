import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { DbInstance } from '@/db';
import { UserConfigSchema, type IUserConfig } from './user.schema';

export class UserService {
	constructor(private db: DbInstance) { }

	/**
	 * 从数据库获取用户配置
	 */
	async getUserConfig(uid: string): Promise<IUserConfig | null> {
		try {
			const userRecord = await this.db.select().from(users).where(eq(users.id, uid)).get();

			if (!userRecord) {
				return null;
			}

			// 解析基础配置
			const partialConfig = userRecord.config;

			// 合并数据库字段到配置对象
			// 优先使用数据库字段作为单一真理源
			const config: IUserConfig = {
				...partialConfig,
				accessToken: userRecord.accessToken,
				// 如果数据库字段为空字符串，则在配置对象中视为 undefined (对应 optional)
				requiredFilters: userRecord.requiredFilters || undefined,
				ruleUrl: userRecord.ruleUrl || undefined,
				fileName: userRecord.fileName || undefined,
				appendSubList: userRecord.appendSubList ? JSON.parse(userRecord.appendSubList) : undefined,
				ruleOverwrite: userRecord.ruleOverwrite || undefined,
			};

			return {
				...config,
				updatedAt: userRecord.updatedAt,
			};
		} catch (error) {
			console.error(`获取用户配置失败: ${uid}`, error);
			return null;
		}
	}

	/**
	 * 保存用户配置
	 */
	async saveUserConfig(uid: string, config: IUserConfig): Promise<boolean> {
		try {
			// 验证配置
			UserConfigSchema.parse(config);

			const now = new Date().toISOString();

			// 提取需要单独存储的字段
			const { accessToken, requiredFilters, ruleUrl, fileName, appendSubList, ruleOverwrite, ...restConfig } = config;

			// 准备数据库记录
			const userValues = {
				accessToken: accessToken,
				// 处理可选字段：如果为 undefined，则存储为空字符串（或使用数据库默认值）
				requiredFilters: requiredFilters || '',
				ruleUrl: ruleUrl || '',
				// fileName 有默认值 'miho-cfg.yaml'，如果未提供则使用默认值
				fileName: fileName || `${uid}.yaml`,
				// appendSubList 有默认值 ''，如果未提供则使用默认值
				appendSubList: appendSubList ? JSON.stringify(appendSubList) : '',
				ruleOverwrite: ruleOverwrite || '',
				// config 字段只存储剩余的配置项，避免数据冗余
				config: restConfig,
				updatedAt: now
			};

			// 检查是否存在
			const existing = await this.db.select().from(users).where(eq(users.id, uid)).get();

			if (existing) {
				await this.db.update(users)
					.set(userValues)
					.where(eq(users.id, uid))
					.execute();
			} else {
				await this.db.insert(users)
					.values({
						id: uid,
						...userValues,
						createdAt: now,
					})
					.execute();
			}

			return true;
		} catch (error) {
			console.error(`保存用户配置失败: ${uid}`, error);
			return false;
		}
	}

	/**
	 * 删除用户配置
	 */
	async deleteUserConfig(uid: string): Promise<boolean> {
		try {
			await this.db.delete(users).where(eq(users.id, uid)).execute();
			return true;
		} catch (error) {
			console.error(`删除用户配置失败: ${uid}`, error);
			return false;
		}
	}

	/**
	 * 验证并获取用户
	 */
	async validateAndGetUser(uid: string, accessToken: string): Promise<IUserConfig | null> {
		try {
			const user = await this.getUserConfig(uid);
			if (!user) {
				return null;
			}

			if (user.accessToken !== accessToken) {
				return null;
			}

			return user;
		} catch (error) {
			console.error(`验证用户失败: ${uid}`, error);
			return null;
		}
	}

	/**
	 * 获取所有用户列表
	 */
	async getAllUsers(): Promise<string[]> {
		try {
			const allUsers = await this.db.select({ id: users.id }).from(users).all();
			return allUsers.map((u: { id: string }) => u.id).sort();
		} catch (error) {
			console.error('获取用户列表失败', error);
			return [];
		}
	}

	/**
	 * 更新用户配置 (alias for saveUserConfig for compatibility)
	 */
	async updateUser(uid: string, body: { config: IUserConfig }): Promise<IUserConfig | null> {
		const success = await this.saveUserConfig(uid, body.config);
		if (success) {
			return this.getUserConfig(uid);
		}
		throw new Error('Update failed');
	}
}
