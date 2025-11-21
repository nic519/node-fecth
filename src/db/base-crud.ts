import { getDb } from '@/db';
import { eq } from 'drizzle-orm';

/**
 * 通用 CRUD 基类 - Supabase 风格
 * 提供开箱即用的增删改查功能
 *
 * @example
 * ```typescript
 * const crud = new BaseCRUD(env, templates);
 * const all = await crud.select();
 * const one = await crud.selectById('123');
 * const created = await crud.insert({ name: 'test', description: 'desc', content: 'yaml' });
 * const updated = await crud.update('123', { name: 'updated' });
 * await crud.delete('123');
 * ```
 */
export class BaseCRUD<T extends { id: string; createdAt: string; updatedAt: string }> {
	protected db;

	constructor(
		protected env: Env,
		protected table: any // Drizzle table schema
	) {
		this.db = getDb(env);
	}

	/**
	 * 🔍 查询所有记录
	 */
	async select(): Promise<T[]> {
		return await this.db.select().from(this.table);
	}

	/**
	 * 🔍 根据 ID 查询单条记录
	 * @returns 找到返回记录，未找到返回 null
	 */
	async selectById(id: string): Promise<T | null> {
		const [result] = await this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1);
		return result || null;
	}

	/**
	 * 🆕 插入新记录
	 * 自动生成 id、createdAt、updatedAt
	 */
	async insert(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
		const now = new Date().toISOString();
		const newRecord = {
			id: Date.now().toString(),
			...data,
			createdAt: now,
			updatedAt: now,
		} as T;

		await this.db.insert(this.table).values(newRecord);
		return newRecord;
	}

	/**
	 * ✏️ 更新记录
	 * 自动更新 updatedAt
	 * @throws 如果记录不存在
	 */
	async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
		const existing = await this.selectById(id);
		if (!existing) {
			throw new Error('记录不存在');
		}

		const now = new Date().toISOString();
		const updates = { ...data, updatedAt: now };

		await this.db.update(this.table).set(updates).where(eq(this.table.id, id));

		return { ...existing, ...updates } as T;
	}

	/**
	 * 🗑️ 删除记录
	 * @throws 如果记录不存在
	 */
	async delete(id: string): Promise<void> {
		const existing = await this.selectById(id);
		if (!existing) {
			throw new Error('记录不存在');
		}

		await this.db.delete(this.table).where(eq(this.table.id, id));
	}
}
