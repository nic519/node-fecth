import { BaseCRUD } from '@/db/base-crud';
import { users, type User } from '@/db/schema';
import { IScUserApiModel, IUserConfig } from '@/routes/modules/user/schema.user';

/**
 * 用户服务类
 * 统一管理用户 CRUD 业务逻辑
 */
export class UserService {
	private crud: BaseCRUD<User>;

	constructor(env: Env) {
		this.crud = new BaseCRUD<User>(env, users);
	}

	/**
	 * 解析用户配置（从 JSON 字符串到对象）
	 */
	private parseUserConfig(configJson: string): IUserConfig {
		return JSON.parse(configJson);
	}

	/**
	 * 序列化用户配置（从对象到 JSON 字符串）
	 */
	private stringifyUserConfig(config: IUserConfig): string {
		return JSON.stringify(config);
	}

	/**
	 * 转换数据库用户模型为 API 模型（解析 config）
	 */
	private toApiModel(dbUser: User): IScUserApiModel {
		return {
			id: dbUser.id,
			config: this.parseUserConfig(dbUser.config),
			accessToken: dbUser.accessToken,
			createdAt: dbUser.createdAt,
			updatedAt: dbUser.updatedAt,
		};
	}

	/**
	 * 获取所有用户列表
	 */
	async getAllUsers(): Promise<IScUserApiModel[]> {
		const users = await this.crud.select();
		return users.map((user) => this.toApiModel(user));
	}

	/**
	 * 根据 ID 获取用户
	 * @param uid 用户ID
	 * @returns 用户信息，如果不存在返回 null
	 */
	async getUserById(uid: string): Promise<IScUserApiModel | null> {
		const user = await this.crud.selectById(uid);
		if (!user) {
			return null;
		}
		return this.toApiModel(user);
	}

	/**
	 * 创建新用户
	 * @param uid 用户ID
	 * @param config 用户配置
	 * @returns 创建的用户信息
	 */
	async createUser(uid: string, config: IUserConfig): Promise<IScUserApiModel> {
		const dbData = {
			id: uid,
			config: this.stringifyUserConfig(config),
			accessToken: config.accessToken,
		} as any;

		const created = await this.crud.insert(dbData);
		return this.toApiModel(created);
	}

	/**
	 * 更新用户配置
	 * @param uid 用户ID
	 * @param config 用户配置
	 * @returns 更新后的用户信息
	 */
	async updateUser(uid: string, config: IUserConfig): Promise<IScUserApiModel> {
		const updateData = {
			config: this.stringifyUserConfig(config),
			accessToken: config.accessToken,
			updatedAt: new Date().toISOString(),
		} as any;

		const updated = await this.crud.update(uid, updateData);
		return this.toApiModel(updated);
	}

	/**
	 * 创建或更新用户（Upsert）
	 * @param uid 用户ID
	 * @param config 用户配置
	 * @returns 保存后的用户信息
	 */
	async upsertUser(uid: string, config: IUserConfig): Promise<IScUserApiModel> {
		const existingUser = await this.crud.selectById(uid);

		if (existingUser) {
			return await this.updateUser(uid, config);
		} else {
			return await this.createUser(uid, config);
		}
	}

	/**
	 * 删除用户
	 * @param uid 用户ID
	 */
	async deleteUser(uid: string): Promise<void> {
		await this.crud.delete(uid);
	}

	/**
	 * 检查用户是否存在
	 * @param uid 用户ID
	 */
	async userExists(uid: string): Promise<boolean> {
		const user = await this.crud.selectById(uid);
		return user !== null;
	}
}
