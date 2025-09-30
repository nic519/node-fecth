import { NavigationBar } from '@/components/NavigationBar';
import { YamlEditor } from '@/components/YamlEditor';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { ConfigTemplate } from '@/types/user-config';
import { CheckCircleIcon, DocumentTextIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface TemplateItem extends ConfigTemplate {
	isSelected?: boolean;
	configContent?: string;
}

export function AdminTemplates() {
	// 设置页面标题
	usePageTitle('配置模板');

	const [templates, setTemplates] = useState<TemplateItem[]>([
		{
			id: '1',
			name: '默认 Clash 配置',
			type: 'clash',
			lastModified: new Date().toISOString().split('T')[0],
			isSelected: true,
			configContent: `# Clash 配置模板
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
			id: '2',
			name: '简化 Clash 配置',
			type: 'clash',
			lastModified: '2024-01-20',
			isSelected: false,
			configContent: `# 简化 Clash 配置
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
			id: '3',
			name: '游戏专用配置',
			type: 'clash',
			lastModified: '2024-01-18',
			isSelected: false,
			configContent: `# 游戏专用 Clash 配置
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
	]);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
			// TODO: 从 API 获取模板数据
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : '加载模板失败');
		} finally {
			setLoading(false);
		}
	};

	const selectedTemplate = templates.find((t) => t.isSelected);
	const currentConfigContent = selectedTemplate?.configContent || '';

	const handleSelectTemplate = (templateId: string) => {
		setTemplates((prev) =>
			prev.map((template) => ({
				...template,
				isSelected: template.id === templateId,
			})),
		);
		setIsEditing(false);
		setValidationErrors([]);
	};

	const handleCreateTemplate = () => {
		const newTemplate: TemplateItem = {
			id: Date.now().toString(),
			name: '新配置模板',
			type: 'clash',
			lastModified: new Date().toISOString().split('T')[0],
			isSelected: true,
			configContent: `# 新配置模板
# 请在此处编辑您的配置`,
		};

		setTemplates((prev) => prev.map((t) => ({ ...t, isSelected: false })).concat(newTemplate));
		setIsEditing(true);
	};

	const handleDeleteTemplate = (templateId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (templates.length <= 1) {
			alert('至少需要保留一个模板');
			return;
		}

		if (confirm('确定要删除这个模板吗？')) {
			setTemplates((prev) => {
				const newTemplates = prev.filter((t) => t.id !== templateId);
				if (newTemplates.length > 0 && !newTemplates.some((t) => t.isSelected)) {
					newTemplates[0].isSelected = true;
				}
				return newTemplates;
			});
			setIsEditing(false);
		}
	};

	const handleUpdateTemplate = (field: keyof TemplateItem, value: any) => {
		if (!selectedTemplate) return;

		setTemplates((prev) => prev.map((template) => (template.id === selectedTemplate.id ? { ...template, [field]: value } : template)));
	};

	const handleUpdateConfigContent = (content: string) => {
		if (!selectedTemplate) return;

		setTemplates((prev) =>
			prev.map((template) => (template.id === selectedTemplate.id ? { ...template, configContent: content } : template)),
		);
	};

	const handleSave = async () => {
		if (!selectedTemplate) return;

		try {
			setLoading(true);
			const updatedTemplate = {
				...selectedTemplate,
				lastModified: new Date().toISOString().split('T')[0],
			};

			setTemplates((prev) => prev.map((template) => (template.id === selectedTemplate.id ? updatedTemplate : template)));

			setIsEditing(false);
			// TODO: 保存到后端 API
			alert('模板保存成功！');
		} catch (err) {
			alert('保存失败：' + (err instanceof Error ? err.message : '未知错误'));
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setIsEditing(false);
		loadTemplates();
	};

	return (
		<div className="min-h-screen bg-gray-100">
			{/* 导航栏 */}
			<NavigationBar superToken={superToken} currentPage="templates" />

			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					{/* 错误信息 */}
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
							<div className="text-red-800">{error}</div>
						</div>
					)}

					{/* 主要内容区域 - 左右布局 */}
					<div className="flex gap-6" style={{ height: 'calc(100vh - 180px)', minHeight: '700px' }}>
						{/* 左侧 - 模板列表 */}
						<div className="w-96 flex flex-col">
							<div className="bg-white rounded-lg shadow-sm border flex flex-col h-full">
								{/* 头部 */}
								<div className="px-6 py-4 border-b border-gray-200">
									<div className="flex justify-between items-center">
										<div>
											<h3 className="text-lg font-semibold text-gray-900">配置模板</h3>
											<p className="text-sm text-gray-500 mt-1">管理多个配置模板</p>
										</div>
										<button
											onClick={handleCreateTemplate}
											className="flex items-center px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
										>
											<PlusIcon className="w-4 h-4 mr-1" />
											新建模板
										</button>
									</div>
								</div>

								{/* 模板列表 */}
								<div className="flex-1 overflow-y-auto">
									{templates.map((template) => (
										<div
											key={template.id}
											className={`border-b border-gray-100 last:border-b-0 transition-all duration-200 ${
												template.isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'
											}`}
										>
											<div className="px-6 py-4 cursor-pointer" onClick={() => handleSelectTemplate(template.id)}>
												<div className="flex items-start justify-between">
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2 mb-2">
															<DocumentTextIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
															<span className="font-medium text-gray-900 truncate">{template.name}</span>
															{template.isSelected && <CheckCircleIcon className="w-5 h-5 text-purple-600 flex-shrink-0" />}
														</div>
														<div className="text-xs text-gray-500">修改于: {template.lastModified}</div>
													</div>
													<button
														onClick={(e) => handleDeleteTemplate(template.id, e)}
														className="p-1 hover:bg-red-100 rounded transition-colors group"
														disabled={templates.length <= 1}
													>
														<TrashIcon className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" />
													</button>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* 右侧 - 配置编辑器 */}
						<div className="flex-1 flex flex-col">
							{selectedTemplate ? (
								<div className="bg-white rounded-lg shadow-sm border flex flex-col h-full">
									{/* 头部 - 编辑按钮 */}

									{!isEditing && (
										<div className="px-6 py-3 border-b border-gray-200 flex justify-end">
											<button
												onClick={() => setIsEditing(true)}
												className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
											>
												开始编辑
											</button>
										</div>
									)}

									{/* 编辑器区域 */}
									<div className="flex-1 flex flex-col p-6 overflow-hidden">
										{isEditing && (
											<div className="mb-4 space-y-3">
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">模板名称</label>
													<input
														type="text"
														value={selectedTemplate.name}
														onChange={(e) => handleUpdateTemplate('name', (e.target as HTMLInputElement).value)}
														className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
													/>
												</div>
											</div>
										)}

										{/* 语法错误提示 */}
										{validationErrors.length > 0 && (
											<div className="mb-3 flex items-center text-sm text-red-600">
												<svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
													<path
														fillRule="evenodd"
														d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
														clipRule="evenodd"
													/>
												</svg>
												<span>{validationErrors.length} 个语法错误</span>
											</div>
										)}

										{/* YAML 编辑器 - 占据剩余空间 */}
										<div className="flex-1 min-h-[300px]">
											<YamlEditor
												key={selectedTemplate?.id}
												value={currentConfigContent}
												onChange={handleUpdateConfigContent}
												height="100%"
												readOnly={!isEditing}
												onValidate={setValidationErrors}
											/>
										</div>

										{/* 验证错误详情 */}
										{validationErrors.length > 0 && (
											<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
												<h4 className="text-sm font-medium text-red-800 mb-2">语法错误：</h4>
												<ul className="text-sm text-red-700 space-y-1">
													{validationErrors.map((error, index) => (
														<li key={index} className="flex items-start">
															<span className="mr-2">•</span>
															<span>{error}</span>
														</li>
													))}
												</ul>
											</div>
										)}

										{/* 操作按钮 */}
										<div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
											<div className="flex space-x-3">
												<button className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
													导出配置
												</button>
												<button className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
													重置为默认
												</button>
												<button className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
													复制配置
												</button>
											</div>
											{isEditing && (
												<div className="flex space-x-3">
													<button
														onClick={handleReset}
														className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
													>
														取消
													</button>
													<button
														onClick={handleSave}
														disabled={loading || validationErrors.length > 0}
														className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
													>
														{loading ? '保存中...' : '保存配置'}
													</button>
												</div>
											)}
										</div>
									</div>
								</div>
							) : (
								<div className="bg-white rounded-lg shadow-sm border h-full flex items-center justify-center">
									<div className="text-center">
										<DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
										<h3 className="mt-2 text-sm font-medium text-gray-900">未选择模板</h3>
										<p className="mt-1 text-sm text-gray-500">请从左侧选择一个配置模板进行编辑</p>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
