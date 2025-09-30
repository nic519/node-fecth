import type { ConfigTemplate } from '@/types/user-config';
import { useEffect, useState } from 'react';

export function AdminTemplates() {
	const [template, setTemplate] = useState<ConfigTemplate>({
		id: 1,
		name: '默认配置模板',
		description: '适用于所有用户的通用 Clash 配置模板，包含基础规则和节点分组',
		type: 'clash',
		lastModified: new Date().toISOString().split('T')[0],
		isActive: true,
		usageCount: 0,
		version: 'v1.0.0',
	});

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [configContent, setConfigContent] = useState(`# Clash 配置模板
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
  - MATCH,🚀 节点选择`);

	const superToken = new URLSearchParams(window.location.search).get('superToken') || '';

	useEffect(() => {
		if (!superToken) {
			setError('缺少管理员令牌');
			return;
		}
		loadTemplate();
	}, [superToken]);

	const loadTemplate = async () => {
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

	const handleSave = async () => {
		try {
			setLoading(true);
			const updatedTemplate = {
				...template,
				name: template.name,
				description: template.description,
				lastModified: new Date().toISOString().split('T')[0],
			};
			setTemplate(updatedTemplate);
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
		loadTemplate();
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
					{/* 页面标题 */}
					<div className="flex justify-between items-center">
						<div>
							<h2 className="text-2xl font-bold text-gray-900">配置模板管理</h2>
							<p className="text-gray-600 mt-1">管理默认的 Clash 配置模板</p>
						</div>
						{!isEditing && (
							<button
								onClick={() => setIsEditing(true)}
								className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
							>
								编辑模板
							</button>
						)}
					</div>

					{/* 错误信息 */}
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4">
							<div className="text-red-800">{error}</div>
						</div>
					)}

					{/* 主要内容区域 - 左右布局 */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* 左侧 - 模板信息 */}
						<div className="lg:col-span-1 space-y-6">
							{/* 模板信息卡片 */}
							<div className="bg-white rounded-lg shadow-sm border">
								<div className="px-6 py-4 border-b border-gray-200">
									<div className="flex justify-between items-center">
										<div>
											<h3 className="text-lg font-semibold text-gray-900">模板信息</h3>
											<p className="text-sm text-gray-500 mt-1">基础配置信息</p>
										</div>
										<div className="flex items-center space-x-2">
											<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
												template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
											}`}>
												{template.isActive ? '启用' : '禁用'}
											</span>
											<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
												{template.type.toUpperCase()}
											</span>
										</div>
									</div>
								</div>

								{!isEditing ? (
									<div className="p-6 space-y-4">
										<div>
											<label className="block text-sm font-medium text-gray-500 mb-1">模板名称</label>
											<p className="text-base font-medium text-gray-900">{template.name}</p>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-500 mb-1">版本</label>
											<p className="text-base font-medium text-gray-900">{template.version}</p>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-500 mb-1">模板描述</label>
											<p className="text-sm text-gray-900 leading-relaxed">{template.description}</p>
										</div>
										<div className="pt-4 border-t border-gray-100 space-y-2">
											<div className="flex justify-between text-sm">
												<span className="text-gray-500">最后修改</span>
												<span className="text-gray-900">{template.lastModified}</span>
											</div>
											<div className="flex justify-between text-sm">
												<span className="text-gray-500">使用次数</span>
												<span className="text-gray-900">{template.usageCount}</span>
											</div>
											<div className="flex justify-between text-sm">
												<span className="text-gray-500">状态</span>
												<span className="text-green-600 font-medium">正常</span>
											</div>
										</div>
									</div>
								) : (
									<div className="p-6 space-y-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">模板名称</label>
											<input
												type="text"
												value={template.name}
												onChange={(e) => setTemplate({ ...template, name: (e.target as HTMLInputElement).value })}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">版本号</label>
											<input
												type="text"
												value={template.version}
												onChange={(e) => setTemplate({ ...template, version: (e.target as HTMLInputElement).value })}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">模板描述</label>
											<textarea
												rows={3}
												value={template.description}
												onChange={(e) => setTemplate({ ...template, description: (e.target as HTMLTextAreaElement).value })}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
											/>
										</div>
										<div className="pt-4 space-y-2">
											<div className="flex justify-between text-sm">
												<span className="text-gray-500">最后修改</span>
												<span className="text-gray-900">{template.lastModified}</span>
											</div>
											<div className="flex justify-between text-sm">
												<span className="text-gray-500">使用次数</span>
												<span className="text-gray-900">{template.usageCount}</span>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* 使用说明 */}
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
								<h3 className="text-base font-semibold text-blue-900 mb-2">使用说明</h3>
								<ul className="space-y-1.5 text-xs text-blue-800">
									<li className="flex items-start">
										<span className="mr-1.5">•</span>
										<span>系统会自动将节点插入到 proxies 数组</span>
									</li>
									<li className="flex items-start">
										<span className="mr-1.5">•</span>
										<span>确保 proxy-groups 配置正确</span>
									</li>
									<li className="flex items-start">
										<span className="mr-1.5">•</span>
										<span>保存后所有订阅将使用新模板</span>
									</li>
								</ul>
							</div>
						</div>

						{/* 右侧 - 配置编辑器 */}
						<div className="lg:col-span-2">
							<div className="bg-white rounded-lg shadow-sm border h-full">
								<div className="px-6 py-4 border-b border-gray-200">
									<h3 className="text-lg font-semibold text-gray-900">配置内容</h3>
									<p className="text-sm text-gray-500 mt-1">YAML 格式的 Clash 配置模板</p>
								</div>
								<div className="p-6">
									<div className="mb-4">
										<textarea
											value={configContent}
											onChange={(e) => setConfigContent((e.target as HTMLTextAreaElement).value)}
											className="w-full h-[500px] px-4 py-3 font-mono text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
											placeholder="输入 YAML 配置内容..."
											spellCheck={false}
										/>
									</div>
									<div className="flex justify-between items-center">
										<div className="flex space-x-3">
											<button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
												验证语法
											</button>
											<button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
												格式化
											</button>
											<button className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors">
												重置为默认
											</button>
											<button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
												全屏编辑
											</button>
										</div>
										{isEditing && (
											<div className="flex space-x-3">
												<button
													onClick={handleReset}
													className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
												>
													取消
												</button>
												<button
													onClick={handleSave}
													disabled={loading}
													className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
												>
													{loading ? '保存中...' : '保存配置'}
												</button>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
