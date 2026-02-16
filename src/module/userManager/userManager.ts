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
	 * 获取用户配置
	 */
	async getUserConfig(uid: string): Promise<ConfigResponse | null> {
		try {
			const db = getDb(this.env);
			const userRecord = await db.select().from(users).where(eq(users.id, uid)).get();

			if (!userRecord) {
				return null;
			}

			const config = JSON.parse(userRecord.config) as UserConfig;

			return {
				config,
				assetToken: userRecord.accessToken,
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

			// 检查是否存在
			const existing = await db.select().from(users).where(eq(users.id, uid)).get();

			if (existing) {
				await db.update(users)
					.set({
						config: JSON.stringify(config),
						accessToken: config.accessToken,
						updatedAt: now
					})
					.where(eq(users.id, uid))
					.execute();
			} else {
				await db.insert(users)
					.values({
						id: uid,
						config: JSON.stringify(config),
						accessToken: config.accessToken,
						createdAt: now,
						updatedAt: now
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

			if (user.config.accessToken !== accessToken) {
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
