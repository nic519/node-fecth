import { getDb } from '@/db';
import { users } from '@/db/schema';
import { ConfigResponse, UserConfig, UserConfigSchema } from '@/types/openapi-schemas';
import { eq } from 'drizzle-orm';

export class UserManager {
	private env: Env;

	constructor(env: Env) {
		this.env = env;
	}

	/**
	 * 从数据库获取用户配置
	 */
	async getUserConfig(uid: string): Promise<ConfigResponse | null> {
		try {
			const db = getDb(this.env);
			const userRecord = await db.select().from(users).where(eq(users.id, uid)).get();

			if (!userRecord) {
				return null;
			}

			// 解析基础配置
			const partialConfig = JSON.parse(userRecord.config);

			// 合并数据库字段到配置对象
			// 优先使用数据库字段作为单一真理源
			const config: UserConfig = {
				...partialConfig,
				accessToken: userRecord.accessToken,
				// 如果数据库字段为空字符串，则在配置对象中视为 undefined (对应 optional)
				requiredFilters: userRecord.requiredFilters || undefined,
				ruleUrl: userRecord.ruleUrl || undefined,
				fileName: userRecord.fileName || undefined,
				appendSubList: userRecord.appendSubList || undefined,
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
	async saveUserConfig(uid: string, config: UserConfig): Promise<boolean> {
		try {
			// 验证配置
			UserConfigSchema.parse(config);

			const db = getDb(this.env);
			const now = new Date().toISOString();

			// 提取需要单独存储的字段
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { accessToken, requiredFilters, ruleUrl, fileName, appendSubList, ...restConfig } = config;

			// 准备数据库记录
			const userValues = {
				accessToken: accessToken,
				// 处理可选字段：如果为 undefined，则存储为空字符串（或使用数据库默认值）
				requiredFilters: requiredFilters || '',
				ruleUrl: ruleUrl || '',
				// fileName 有默认值 'miho-cfg.yaml'，如果未提供则使用默认值
				fileName: fileName || 'miho-cfg.yaml',
				// appendSubList 有默认值 ''，如果未提供则使用默认值
				appendSubList: appendSubList || '',
				// config 字段只存储剩余的配置项，避免数据冗余
				config: JSON.stringify(restConfig),
				updatedAt: now
			};

			// 检查是否存在
			const existing = await db.select().from(users).where(eq(users.id, uid)).get();

			if (existing) {
				await db.update(users)
					.set(userValues)
					.where(eq(users.id, uid))
					.execute();
			} else {
				await db.insert(users)
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
			const db = getDb(this.env);
			await db.delete(users).where(eq(users.id, uid)).execute();
			return true;
		} catch (error) {
			console.error(`删除用户配置失败: ${uid}`, error);
			return false;
		}
	}

	/**
	 * 验证并获取用户
	 */
	async validateAndGetUser(uid: string, accessToken: string): Promise<ConfigResponse | null> {
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
			const db = getDb(this.env);
			const allUsers = await db.select({ id: users.id }).from(users).all();
			return allUsers.map((u: { id: string }) => u.id).sort();
		} catch (error) {
			console.error('获取用户列表失败', error);
			return [];
		}
	}

	/**
	 * 更新用户配置 (alias for saveUserConfig for compatibility)
	 */
	async updateUser(uid: string, body: { config: UserConfig }): Promise<ConfigResponse | null> {
		const success = await this.saveUserConfig(uid, body.config);
		if (success) {
			return this.getUserConfig(uid);
		}
		throw new Error('Update failed');
	}
}
