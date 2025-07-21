import type { ConfigTemplate } from '@/types/user-config';
import { useEffect, useState } from 'react';

export function AdminTemplates() {
	const [templates, setTemplates] = useState<ConfigTemplate[]>([
		{
			id: 1,
			name: '基础用户配置模板',
			description: '适用于普通用户的基础 Clash 配置，包含常用规则和节点分组',
			type: 'clash',
			lastModified: '2024-01-15',
			isActive: true,
			usageCount: 892,
			version: 'v2.1.3',
		},
		{
			id: 2,
			name: '高级用户配置模板',
			description: '为高级用户提供更多自定义选项，支持高级规则和策略组',
			type: 'clash',
			lastModified: '2024-01-14',
			isActive: true,
			usageCount: 156,
			version: 'v1.8.2',
		},
		{
			id: 3,
			name: '企业级配置模板',
			description: '企业级用户专用配置模板，支持大规模节点管理和负载均衡',
			type: 'clash',
			lastModified: '2024-01-12',
			isActive: true,
			usageCount: 23,
			version: 'v3.0.1',
		},
		{
			id: 4,
			name: '游戏优化模板',
			description: '专为游戏用户优化的配置模板，降低延迟，提升游戏体验',
			type: 'clash',
			lastModified: '2024-01-10',
			isActive: true,
			usageCount: 445,
			version: 'v1.5.7',
		},
		{
			id: 5,
			name: '流媒体专用模板',
			description: '针对流媒体服务优化的配置，支持Netflix、Disney+等平台',
			type: 'clash',
			lastModified: '2024-01-08',
			isActive: false,
			usageCount: 78,
			version: 'v2.3.1',
		},
		{
			id: 6,
			name: '试用用户模板',
			description: '试用用户专用的简化配置模板，功能受限但稳定可靠',
			type: 'clash',
			lastModified: '2024-01-15',
			isActive: true,
			usageCount: 234,
			version: 'v1.0.9',
		},
	]);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [editingTemplate, setEditingTemplate] = useState<ConfigTemplate | null>(null);
	const [newTemplateName, setNewTemplateName] = useState('');
	const [newTemplateDescription, setNewTemplateDescription] = useState('');
	const [newTemplateType, setNewTemplateType] = useState<'clash' | 'v2ray' | 'shadowsocks'>('clash');

	const configSample = `# Clash 配置模板示例
port: 7890
socks-port: 7891
allow-lan: false
mode: rule
log-level: info

proxies:
  - name: "proxy-1"
    type: ss
    server: example.com
    port: 8388
    cipher: aes-256-gcm
    password: "password"

proxy-groups:
  - name: "🚀 节点选择"
    type: select
    proxies:
      - "proxy-1"
      - DIRECT

rules:
  - DOMAIN-SUFFIX,google.com,🚀 节点选择
  - MATCH,DIRECT`;

	const superToken = new URLSearchParams(window.location.search).get('superToken') || '';

	useEffect(() => {
		if (!superToken) {
			setError('缺少管理员令牌');
			return;
		}
		loadTemplates();
	}, [superToken]);

	const loadTemplates = async () => {
		try {
			setLoading(true);
			// 这里应该从 API 获取真实的模板数据
			// 目前使用模拟数据
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : '加载模板数据失败');
		} finally {
			setLoading(false);
		}
	};

	const handleTemplateAction = (action: string, template: ConfigTemplate) => {
		switch (action) {
			case 'edit':
				setEditingTemplate(template);
				setNewTemplateName(template.name);
				setNewTemplateDescription(template.description);
				setNewTemplateType(template.type);
				break;
			case 'copy':
				const copiedTemplate = {
					...template,
					id: templates.length + 1,
					name: `${template.name} (副本)`,
					version: 'v1.0.0',
					usageCount: 0,
				};
				setTemplates([...templates, copiedTemplate]);
				break;
			case 'delete':
				if (confirm(`确定要删除模板 "${template.name}" 吗？`)) {
					setTemplates(templates.filter((t) => t.id !== template.id));
				}
				break;
		}
	};

	const handleCreateTemplate = () => {
		if (!newTemplateName.trim()) {
			alert('请输入模板名称');
			return;
		}

		const newTemplate: ConfigTemplate = {
			id: templates.length + 1,
			name: newTemplateName,
			description: newTemplateDescription,
			type: newTemplateType,
			lastModified: new Date().toISOString().split('T')[0],
			isActive: true,
			usageCount: 0,
			version: 'v1.0.0',
		};

		setTemplates([...templates, newTemplate]);
		setNewTemplateName('');
		setNewTemplateDescription('');
		setNewTemplateType('clash');
		setEditingTemplate(null);
	};

	const handleSaveTemplate = () => {
		if (!editingTemplate || !newTemplateName.trim()) {
			return;
		}

		setTemplates(
			templates.map((t) =>
				t.id === editingTemplate.id ? { ...t, name: newTemplateName, description: newTemplateDescription, type: newTemplateType } : t
			)
		);

		setEditingTemplate(null);
		setNewTemplateName('');
		setNewTemplateDescription('');
		setNewTemplateType('clash');
	};

	const resetForm = () => {
		setEditingTemplate(null);
		setNewTemplateName('');
		setNewTemplateDescription('');
		setNewTemplateType('clash');
	};

	return (
		<div className="min-h-screen bg-gray-100">
			{/* 导航栏 */}
			<nav className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex items-center">
							<h1 className="text-xl font-semibold text-gray-900">配置模板</h1>
						</div>
						<div className="flex items-center space-x-4">
							<a
								href={`/admin/dashboard?superToken=${superToken}`}
								className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
							>
								控制台
							</a>
							<a
								href={`/admin/users?superToken=${superToken}`}
								className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
							>
								用户管理
							</a>
							<a
								href={`/admin/monitor?superToken=${superToken}`}
								className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
							>
								系统监控
							</a>
						</div>
					</div>
				</div>
			</nav>

			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0 space-y-6">
					{/* 页面标题和操作按钮 */}
					<div className="flex justify-between items-center">
						<div>
							<h2 className="text-2xl font-bold text-gray-900">配置模板</h2>
							<p className="text-gray-600 mt-1">管理系统中的配置模板</p>
						</div>
						<button
							onClick={() => setEditingTemplate({} as ConfigTemplate)}
							className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
						>
							+ 新建模板
						</button>
					</div>

					{/* 错误信息 */}
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4">
							<div className="text-red-800">{error}</div>
						</div>
					)}

					{/* 模板列表 */}
					<div className="bg-white rounded-lg shadow-sm border overflow-hidden">
						<div className="px-6 py-4 border-b border-gray-200">
							<h3 className="text-lg font-semibold text-gray-900">模板列表</h3>
						</div>
						{loading ? (
							<div className="p-6 text-center">
								<div className="text-gray-500">加载中...</div>
							</div>
						) : (
							<div className="divide-y divide-gray-200">
								{templates.map((template) => (
									<div key={template.id} className="p-6">
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<div className="flex items-center space-x-3">
													<h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
													<span
														className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
															template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
														}`}
													>
														{template.isActive ? '启用' : '禁用'}
													</span>
													<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
														{template.type.toUpperCase()}
													</span>
													<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
														{template.version}
													</span>
												</div>
												<p className="text-gray-600 mt-1">{template.description}</p>
												<div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
													<span>最后修改: {template.lastModified}</span>
													<span>使用次数: {template.usageCount}</span>
												</div>
											</div>
											<div className="flex space-x-2 ml-4">
												<button
													onClick={() => handleTemplateAction('edit', template)}
													className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
												>
													编辑
												</button>
												<button
													onClick={() => handleTemplateAction('copy', template)}
													className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
												>
													复制
												</button>
												<button
													onClick={() => handleTemplateAction('delete', template)}
													className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
												>
													删除
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* 配置编辑器 */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div className="bg-white rounded-lg shadow-sm border">
							<div className="px-6 py-4 border-b border-gray-200">
								<h3 className="text-lg font-semibold text-gray-900">{editingTemplate ? '编辑模板' : '配置编辑器'}</h3>
							</div>
							<div className="p-6">
								<div className="mb-4">
									<label className="block text-sm font-medium text-gray-700 mb-2">模板名称</label>
									<input
										type="text"
										value={newTemplateName}
										onChange={(e) => setNewTemplateName((e.target as HTMLInputElement).value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
										placeholder="输入模板名称..."
									/>
								</div>
								<div className="mb-4">
									<label className="block text-sm font-medium text-gray-700 mb-2">模板描述</label>
									<textarea
										rows={3}
										value={newTemplateDescription}
										onChange={(e) => setNewTemplateDescription((e.target as HTMLTextAreaElement).value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
										placeholder="输入模板描述..."
									/>
								</div>
								<div className="mb-4">
									<label className="block text-sm font-medium text-gray-700 mb-2">配置类型</label>
									<select
										value={newTemplateType}
										onChange={(e) => setNewTemplateType((e.target as HTMLSelectElement).value as 'clash' | 'v2ray' | 'shadowsocks')}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
									>
										<option value="clash">Clash</option>
										<option value="v2ray">V2Ray</option>
										<option value="shadowsocks">Shadowsocks</option>
									</select>
								</div>
								<div className="flex space-x-3">
									<button
										onClick={editingTemplate?.id ? handleSaveTemplate : handleCreateTemplate}
										className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
									>
										{editingTemplate?.id ? '保存模板' : '创建模板'}
									</button>
									<button
										onClick={resetForm}
										className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
									>
										重置
									</button>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-lg shadow-sm border">
							<div className="px-6 py-4 border-b border-gray-200">
								<h3 className="text-lg font-semibold text-gray-900">配置预览</h3>
							</div>
							<div className="p-6">
								<div className="bg-gray-50 rounded-lg p-4 h-96 overflow-auto">
									<pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">{configSample}</pre>
								</div>
								<div className="mt-4 flex space-x-3">
									<button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
										验证配置
									</button>
									<button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
										导出配置
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* 模板统计 */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="bg-white p-6 rounded-lg shadow-sm border">
							<div className="flex items-center">
								<div className="text-3xl mr-4">📄</div>
								<div>
									<p className="text-sm font-medium text-gray-600">总模板数</p>
									<p className="text-2xl font-bold text-gray-900">{templates.length}</p>
								</div>
							</div>
						</div>
						<div className="bg-white p-6 rounded-lg shadow-sm border">
							<div className="flex items-center">
								<div className="text-3xl mr-4">✅</div>
								<div>
									<p className="text-sm font-medium text-gray-600">启用模板</p>
									<p className="text-2xl font-bold text-green-600">{templates.filter((t) => t.isActive).length}</p>
								</div>
							</div>
						</div>
						<div className="bg-white p-6 rounded-lg shadow-sm border">
							<div className="flex items-center">
								<div className="text-3xl mr-4">👥</div>
								<div>
									<p className="text-sm font-medium text-gray-600">总使用次数</p>
									<p className="text-2xl font-bold text-blue-600">{templates.reduce((sum, t) => sum + t.usageCount, 0)}</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
