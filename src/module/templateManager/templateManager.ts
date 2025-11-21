import { getDb } from '@/db';
import { templates } from '@/db/schema';
import { ConfigTemplate } from '@/types/openapi-schemas';
import { eq } from 'drizzle-orm';

/**
 * 配置模板管理器（基于 D1 数据库）
 * 负责管理配置模板的CRUD操作
 */
export class TemplateManager {
	private db;

	constructor(env: Env) {
		this.db = getDb(env);
	}

	/**
	 * 生成新的模板ID
	 */
	private generateId(): string {
		return Date.now().toString();
	}

	/**
	 * 获取所有模板
	 */
	async getAllTemplates(): Promise<ConfigTemplate[]> {
		try {
			const result = await this.db.select().from(templates);

			// 转换数据库格式到 API 格式
			return result.map((row) => ({
				id: row.id,
				name: row.name,
				description: row.description,
				content: row.content,
				createdAt: row.createdAt,
				updatedAt: row.updatedAt,
			}));
		} catch (error) {
			console.error('获取模板列表失败:', error);
			throw new Error('获取模板列表失败');
		}
	}

	/**
	 * 根据ID获取模板
	 */
	async getTemplateById(id: string): Promise<ConfigTemplate | null> {
		try {
			const result = await this.db.select().from(templates).where(eq(templates.id, id)).limit(1);

			if (result.length === 0) {
				return null;
			}

			const row = result[0];
			return {
				id: row.id,
				name: row.name,
				description: row.description,
				content: row.content,
				createdAt: row.createdAt,
				updatedAt: row.updatedAt,
			};
		} catch (error) {
			console.error('获取模板失败:', error);
			throw new Error('获取模板失败');
		}
	}

	/**
	 * 创建新模板
	 */
	async createTemplate(templateData: { name: string; description: string; content: string }): Promise<ConfigTemplate> {
		try {
			const id = this.generateId();
			const now = new Date().toISOString();

			await this.db.insert(templates).values({
				id,
				name: templateData.name,
				description: templateData.description,
				content: templateData.content,
				createdAt: now,
				updatedAt: now,
			});

			return {
				id,
				name: templateData.name,
				description: templateData.description,
				content: templateData.content,
				createdAt: now,
				updatedAt: now,
			};
		} catch (error) {
			console.error('创建模板失败:', error);
			throw new Error('创建模板失败');
		}
	}

	/**
	 * 更新模板
	 */
	async updateTemplate(id: string, updateData: { name?: string; description?: string; content?: string }): Promise<ConfigTemplate> {
		try {
			const existingTemplate = await this.getTemplateById(id);
			if (!existingTemplate) {
				throw new Error('模板不存在');
			}

			const now = new Date().toISOString();
			const updates: any = {
				updatedAt: now,
			};

			if (updateData.name !== undefined) updates.name = updateData.name;
			if (updateData.description !== undefined) updates.description = updateData.description;
			if (updateData.content !== undefined) updates.content = updateData.content;

			await this.db.update(templates).set(updates).where(eq(templates.id, id));

			return {
				...existingTemplate,
				...updateData,
				id,
				updatedAt: now,
			};
		} catch (error) {
			console.error('更新模板失败:', error);
			throw new Error('更新模板失败');
		}
	}

	/**
	 * 删除模板
	 */
	async deleteTemplate(id: string): Promise<void> {
		try {
			const template = await this.getTemplateById(id);
			if (!template) {
				throw new Error('模板不存在');
			}

			await this.db.delete(templates).where(eq(templates.id, id));
		} catch (error) {
			console.error('删除模板失败:', error);
			throw error;
		}
	}

	/**
	 * 应用模板到用户配置
	 * 将模板内容转换为用户可用的完整URL
	 */
	async applyTemplateToUser(templateId: string, userId: string): Promise<string> {
		try {
			const template = await this.getTemplateById(templateId);
			if (!template) {
				throw new Error('模板不存在');
			}

			// 这里需要根据实际的业务逻辑构建完整的URL
			// 假设模板内容包含配置参数，需要转换为InnerUser.ruleUrl
			const baseUrl = process.env.BASE_URL || 'https://example.com';
			const templateUrl = `${baseUrl}/api/subscription?token=${userId}&template=${templateId}`;

			return templateUrl;
		} catch (error) {
			console.error('应用模板失败:', error);
			throw new Error('应用模板失败');
		}
	}
}
