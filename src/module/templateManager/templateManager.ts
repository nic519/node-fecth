import { ConfigTemplate } from '@/types/openapi-schemas';
import { KvService } from '@/module/kv/services/kvService';

/**
 * 配置模板管理器
 * 负责管理配置模板的CRUD操作
 */
export class TemplateManager {
	private kvService: KvService;
	private readonly TEMPLATE_PREFIX = 'template:';
	private readonly TEMPLATE_LIST_KEY = 'templates:list';

	constructor(env: Env) {
		this.kvService = new KvService(env);
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
			const templateListJson = await this.kvService.get(this.TEMPLATE_LIST_KEY);
			if (!templateListJson) {
				// 如果没有模板列表，返回默认模板
				return await this.createDefaultTemplates();
			}

			const templateIds: string[] = JSON.parse(templateListJson);
			const templates: ConfigTemplate[] = [];

			for (const id of templateIds) {
				const templateJson = await this.kvService.get(`${this.TEMPLATE_PREFIX}${id}`);
				if (templateJson) {
					const template = JSON.parse(templateJson) as ConfigTemplate;
					templates.push(template);
				}
			}

			return templates;
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
			const templateJson = await this.kvService.get(`${this.TEMPLATE_PREFIX}${id}`);
			if (!templateJson) {
				return null;
			}
			return JSON.parse(templateJson) as ConfigTemplate;
		} catch (error) {
			console.error('获取模板失败:', error);
			throw new Error('获取模板失败');
		}
	}

	/**
	 * 创建新模板
	 */
	async createTemplate(templateData: Omit<ConfigTemplate, 'id' | 'createdAt' | 'updatedAt' | 'lastModified'>): Promise<ConfigTemplate> {
		try {
			const id = this.generateId();
			const now = new Date().toISOString();

			const template: ConfigTemplate = {
				...templateData,
				id,
				createdAt: now,
				updatedAt: now,
				lastModified: now.split('T')[0],
			};

			// 保存模板
			await this.kvService.put(`${this.TEMPLATE_PREFIX}${id}`, JSON.stringify(template));

			// 更新模板列表
			await this.updateTemplateList(id, 'add');

			return template;
		} catch (error) {
			console.error('创建模板失败:', error);
			throw new Error('创建模板失败');
		}
	}

	/**
	 * 更新模板
	 */
	async updateTemplate(id: string, updateData: Partial<Omit<ConfigTemplate, 'id' | 'createdAt'>>): Promise<ConfigTemplate> {
		try {
			const existingTemplate = await this.getTemplateById(id);
			if (!existingTemplate) {
				throw new Error('模板不存在');
			}

			const updatedTemplate: ConfigTemplate = {
				...existingTemplate,
				...updateData,
				id,
				updatedAt: new Date().toISOString(),
				lastModified: new Date().toISOString().split('T')[0],
			};

			// 保存更新后的模板
			await this.kvService.put(`${this.TEMPLATE_PREFIX}${id}`, JSON.stringify(updatedTemplate));

			return updatedTemplate;
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

			// 检查是否是默认模板
			if (template.isDefault) {
				throw new Error('不能删除默认模板');
			}

			// 删除模板
			await this.kvService.delete(`${this.TEMPLATE_PREFIX}${id}`);

			// 更新模板列表
			await this.updateTemplateList(id, 'remove');
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

	/**
	 * 更新模板列表
	 */
	private async updateTemplateList(templateId: string, action: 'add' | 'remove'): Promise<void> {
		try {
			const listJson = await this.kvService.get(this.TEMPLATE_LIST_KEY);
			let templateIds: string[] = listJson ? JSON.parse(listJson) : [];

			if (action === 'add') {
				if (!templateIds.includes(templateId)) {
					templateIds.push(templateId);
				}
			} else {
				templateIds = templateIds.filter(id => id !== templateId);
			}

			await this.kvService.put(this.TEMPLATE_LIST_KEY, JSON.stringify(templateIds));
		} catch (error) {
			console.error('更新模板列表失败:', error);
			throw error;
		}
	}

	/**
	 * 创建默认模板
	 */
	private async createDefaultTemplates(): Promise<ConfigTemplate[]> {
		const defaultTemplates: Omit<ConfigTemplate, 'id' | 'createdAt' | 'updatedAt' | 'lastModified'>[] = [
			{
				name: '默认 Clash 配置',
				description: '包含完整功能的 Clash 配置模板',
				type: 'clash',
				isActive: true,
				isDefault: true,
				content: `# Clash 配置模板
port: 7890
socks-port: 7891
allow-lan: false
mode: rule
log-level: info

# DNS 配置
dns:
  enable: true
  ipv6: false
  listen: 0.0.0.0:53
  enhanced-mode: fake-ip
  nameserver:
    - 114.114.114.114
    - 8.8.8.8

# 代理节点将动态插入
proxies: []

# 代理组
proxy-groups:
  - name: "🚀 节点选择"
    type: select
    proxies:
      - "⚡ 自动选择"
      - "🔯 故障转移"
      - DIRECT

  - name: "⚡ 自动选择"
    type: url-test
    proxies: []
    url: "http://www.gstatic.com/generate_204"
    interval: 300

  - name: "🔯 故障转移"
    type: fallback
    proxies: []
    url: "http://www.gstatic.com/generate_204"
    interval: 300

# 规则
rules:
  - GEOIP,CN,DIRECT
  - MATCH,🚀 节点选择`,
			},
			{
				name: '简化 Clash 配置',
				description: '简化的 Clash 配置模板，适合基础使用',
				type: 'clash',
				isActive: true,
				isDefault: false,
				content: `# 简化 Clash 配置
port: 7890
socks-port: 7891
allow-lan: false
mode: rule
log-level: info

# DNS 配置
dns:
  enable: true
  nameserver:
    - 114.114.114.114
    - 8.8.8.8

# 代理节点
proxies: []

# 代理组
proxy-groups:
  - name: "🚀 节点选择"
    type: select
    proxies:
      - DIRECT

# 规则
rules:
  - DOMAIN-SUFFIX,google.com,🚀 节点选择
  - DOMAIN-SUFFIX,youtube.com,🚀 节点选择
  - GEOIP,CN,DIRECT
  - MATCH,🚀 节点选择`,
			},
			{
				name: '游戏专用配置',
				description: '针对游戏优化的 Clash 配置模板',
				type: 'clash',
				isActive: true,
				isDefault: false,
				content: `# 游戏专用 Clash 配置
port: 7890
socks-port: 7891
allow-lan: false
mode: rule
log-level: info

# DNS 配置
dns:
  enable: true
  ipv6: false
  enhanced-mode: fake-ip
  nameserver:
    - 223.5.5.5
    - 119.29.29.29
    - 8.8.8.8

# 代理节点
proxies: []

# 代理组
proxy-groups:
  - name: "🎮 游戏"
    type: select
    proxies:
      - "⚡ 自动选择"
      - "🔯 故障转移"
      - DIRECT

  - name: "⚡ 自动选择"
    type: url-test
    proxies: []
    url: "http://www.gstatic.com/generate_204"
    interval: 150

  - name: "🔯 故障转移"
    type: fallback
    proxies: []
    url: "http://www.gstatic.com/generate_204"
    interval: 150

# 规则
rules:
  - DOMAIN-SUFFIX,steamstatic.com,DIRECT
  - DOMAIN-SUFFIX,steamcommunity.com,DIRECT
  - DOMAIN-SUFFIX,steampowered.com,DIRECT
  - DOMAIN-SUFFIX,epicgames.com,DIRECT
  - DOMAIN-SUFFIX,battle.net,DIRECT
  - GEOIP,CN,DIRECT
  - MATCH,🎮 游戏`,
			},
		];

		const templates: ConfigTemplate[] = [];
		for (const templateData of defaultTemplates) {
			const template = await this.createTemplate(templateData);
			templates.push(template);
		}

		return templates;
	}
}