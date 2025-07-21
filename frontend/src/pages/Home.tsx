import { useEffect, useState } from 'react';

export function Home() {
	const [currentFeature, setCurrentFeature] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentFeature((prev) => (prev + 1) % 3);
		}, 4000);
		return () => clearInterval(interval);
	}, []);

	// 检查是否有管理员 token
	const superToken = new URLSearchParams(window.location.search).get('superToken');
	if (superToken) {
		window.location.href = `/admin/dashboard?superToken=${superToken}`;
		return null;
	}

	const features = [
		{
			icon: '⚡',
			title: '智能配置管理',
			description: '支持多端口模式，智能节点过滤，让您的网络配置更加高效',
		},
		{
			icon: '🔒',
			title: '安全访问控制',
			description: '基于访问令牌的身份验证，确保您的配置数据安全可靠',
		},
		{
			icon: '📱',
			title: '现代化界面',
			description: '响应式设计，支持桌面和移动端，随时随地管理您的配置',
		},
	];

	const configExamples = [
		{ label: '订阅地址', field: 'subscribe', type: '必需', description: '您的节点订阅链接' },
		{ label: '访问令牌', field: 'accessToken', type: '必需', description: '用于身份验证的令牌' },
		{ label: '多端口模式', field: 'multiPortMode', type: '可选', description: '支持 TW、SG、JP、HK、US、VN' },
		{ label: '规则模板', field: 'ruleUrl', type: '可选', description: '自定义规则配置文件地址' },
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
			{/* Header */}
			<header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
								<span className="text-white font-bold text-lg">N</span>
							</div>
							<div>
								<h1 className="text-xl font-bold text-gray-900">节点管理后台</h1>
								<p className="text-xs text-gray-500">专业的节点配置管理平台</p>
							</div>
						</div>
						<div className="hidden sm:flex items-center space-x-4">
							<a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
								功能特性
							</a>
							<a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">
								如何使用
							</a>
							<a href="#access" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
								立即使用
							</a>
						</div>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className="relative py-20 overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
							智能节点配置
							<span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">管理平台</span>
						</h1>
						<p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
							提供专业的节点配置解决方案，支持多订阅源管理、智能节点过滤、 实时配置编辑等强大功能，让您的网络配置管理变得简单高效。
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<a
								href="#access"
								className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
							>
								🚀 开始使用
							</a>
							<a
								href="#features"
								className="border-2 border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
							>
								📋 了解功能
							</a>
						</div>
					</div>

					{/* Dynamic Feature Showcase */}
					<div className="mt-16 max-w-4xl mx-auto">
						<div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-gray-200/50">
							<div className="text-center mb-8">
								<div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-3xl">
									{features[currentFeature].icon}
								</div>
								<h3 className="text-2xl font-bold text-gray-900 mb-2">{features[currentFeature].title}</h3>
								<p className="text-gray-600 text-lg">{features[currentFeature].description}</p>
							</div>
							<div className="flex justify-center space-x-2">
								{features.map((_, index) => (
									<button
										key={index}
										onClick={() => setCurrentFeature(index)}
										className={`w-3 h-3 rounded-full transition-all duration-300 ${
											index === currentFeature ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
										}`}
									/>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="py-20 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-3xl font-bold text-gray-900 mb-4">核心功能特性</h2>
						<p className="text-xl text-gray-600 max-w-3xl mx-auto">为用户提供专业的节点配置管理解决方案</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
						{/* 用户配置管理 */}
						<div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 hover:shadow-lg transition-all duration-300">
							<div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
								<span className="text-white text-xl">⚙️</span>
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-3">配置管理</h3>
							<ul className="text-gray-600 space-y-2">
								<li>• 支持 YAML 格式配置编辑</li>
								<li>• 实时配置验证和语法检查</li>
								<li>• 基于访问令牌的安全认证</li>
								<li>• 配置历史记录和回滚</li>
							</ul>
						</div>

						{/* 多端口模式 */}
						<div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 hover:shadow-lg transition-all duration-300">
							<div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
								<span className="text-white text-xl">🌐</span>
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-3">多端口模式</h3>
							<ul className="text-gray-600 space-y-2">
								<li>• 支持多地区出口配置</li>
								<li>• 智能节点过滤和分组</li>
								<li>• 正则表达式过滤支持</li>
								<li>• 自动负载均衡优化</li>
							</ul>
						</div>

						{/* 订阅管理 */}
						<div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-100 hover:shadow-lg transition-all duration-300">
							<div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
								<span className="text-white text-xl">📡</span>
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-3">订阅管理</h3>
							<ul className="text-gray-600 space-y-2">
								<li>• 多订阅源聚合管理</li>
								<li>• 订阅源标识和分组</li>
								<li>• 地区过滤和包含设置</li>
								<li>• 订阅状态监控</li>
							</ul>
						</div>

						{/* 安全保障 */}
						<div className="bg-gradient-to-br from-red-50 to-rose-50 p-6 rounded-xl border border-red-100 hover:shadow-lg transition-all duration-300">
							<div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
								<span className="text-white text-xl">🔐</span>
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-3">安全保障</h3>
							<ul className="text-gray-600 space-y-2">
								<li>• 基于令牌的身份验证</li>
								<li>• 权限分级管理</li>
								<li>• 数据加密存储</li>
								<li>• 配置备份恢复</li>
							</ul>
						</div>

						{/* 现代化设计 */}
						<div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300">
							<div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mb-4">
								<span className="text-white text-xl">🎨</span>
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-3">现代化界面</h3>
							<ul className="text-gray-600 space-y-2">
								<li>• 响应式设计，支持移动端</li>
								<li>• 直观的用户界面</li>
								<li>• 实时数据更新</li>
								<li>• 深色模式支持</li>
							</ul>
						</div>

						{/* 高级功能 */}
						<div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 hover:shadow-lg transition-all duration-300">
							<div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
								<span className="text-white text-xl">⚡</span>
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-3">高级功能</h3>
							<ul className="text-gray-600 space-y-2">
								<li>• 智能节点选择算法</li>
								<li>• 配置模板系统</li>
								<li>• 批量配置操作</li>
								<li>• 实时状态监控</li>
							</ul>
						</div>
					</div>
				</div>
			</section>

			{/* How it works */}
			<section id="how-it-works" className="py-20 bg-gray-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-3xl font-bold text-gray-900 mb-4">配置字段说明</h2>
						<p className="text-xl text-gray-600">了解各个配置字段的作用和使用方法</p>
					</div>

					<div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
						{configExamples.map((example, index) => (
							<div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
								<div className="flex items-start space-x-4">
									<div className="flex-shrink-0">
										<div
											className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
												example.type === '必需' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
											}`}
										>
											{index + 1}
										</div>
									</div>
									<div className="flex-1">
										<div className="flex items-center space-x-2 mb-2">
											<code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">{example.field}</code>
											<span
												className={`text-xs font-medium px-2 py-1 rounded ${
													example.type === '必需' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
												}`}
											>
												{example.type}
											</span>
										</div>
										<h4 className="font-semibold text-gray-900 mb-1">{example.label}</h4>
										<p className="text-gray-600 text-sm">{example.description}</p>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* 配置示例 */}
					<div className="mt-16 max-w-4xl mx-auto">
						<div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
							<div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
								<h3 className="text-lg font-semibold text-gray-900">完整配置示例</h3>
							</div>
							<div className="p-6">
								<pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
									{`# 基础配置
subscribe: "https://example.com/subscribe"
accessToken: "your-access-token"
ruleUrl: "https://example.com/rules.yaml"
fileName: "config.yaml"

# 多端口模式
multiPortMode:
  - TW
  - HK
  - SG

# 节点过滤
excludeRegex: "(?i)(test|trial|expire)"

# 追加订阅
appendSubList:
  - subscribe: "https://backup.example.com"
    flag: "backup"
    includeArea:
      - US
      - JP`}
								</pre>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Access Section */}
			<section id="access" className="py-20 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-4">开始使用</h2>
						<p className="text-xl text-gray-600">选择适合您的访问方式</p>
					</div>

					<div className="max-w-3xl mx-auto">
						{/* 用户配置 */}
						<div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-100">
							<div className="text-center mb-6">
								<div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
									<span className="text-white text-2xl">👤</span>
								</div>
								<h3 className="text-2xl font-bold text-gray-900 mb-2">用户配置管理</h3>
								<p className="text-gray-600">管理您的个人节点配置</p>
							</div>
							<div className="space-y-4">
								<div className="bg-white/60 p-4 rounded-lg">
									<h4 className="font-semibold text-gray-900 mb-2">访问地址格式</h4>
									<code className="bg-gray-800 text-green-400 px-3 py-2 rounded text-sm block overflow-x-auto">
										/config/用户ID?token=访问令牌
									</code>
								</div>
								<div className="bg-white/60 p-4 rounded-lg">
									<h4 className="font-semibold text-gray-900 mb-2">示例</h4>
									<code className="bg-gray-800 text-green-400 px-3 py-2 rounded text-sm block overflow-x-auto">
										/config/user123?token=your-access-token
									</code>
								</div>
								<div className="bg-white/60 p-4 rounded-lg">
									<h4 className="font-semibold text-gray-900 mb-2">功能特点</h4>
									<ul className="text-sm text-gray-700 space-y-1">
										<li>• 直观的 YAML 配置编辑器</li>
										<li>• 实时配置验证和错误提示</li>
										<li>• 安全的令牌身份验证</li>
										<li>• 一键保存和应用配置</li>
									</ul>
								</div>
							</div>
						</div>
					</div>

					{/* 快速开始按钮 */}
					<div className="text-center mt-12">
						<div className="bg-gradient-to-r from-gray-50 to-blue-50 p-8 rounded-xl border border-gray-200 max-w-2xl mx-auto">
							<h3 className="text-xl font-semibold text-gray-900 mb-4">需要帮助？</h3>
							<p className="text-gray-600 mb-6">如果您需要获取访问令牌或遇到其他问题，请联系系统管理员或查看帮助文档。</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
									📖 查看文档
								</button>
								<button className="border border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 px-6 py-3 rounded-lg font-semibold transition-colors">
									💬 联系支持
								</button>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-gray-900 text-white py-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid md:grid-cols-3 gap-8">
						<div>
							<div className="flex items-center space-x-3 mb-4">
								<div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
									<span className="text-white font-bold">N</span>
								</div>
								<span className="font-bold text-lg">节点管理后台</span>
							</div>
							<p className="text-gray-400 text-sm">专业的节点配置管理平台，让配置管理变得简单高效。</p>
						</div>
						<div>
							<h4 className="font-semibold mb-4">功能特性</h4>
							<ul className="space-y-2 text-sm text-gray-400">
								<li>配置管理</li>
								<li>多端口模式</li>
								<li>订阅管理</li>
								<li>安全保障</li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold mb-4">技术栈</h4>
							<ul className="space-y-2 text-sm text-gray-400">
								<li>Cloudflare Workers</li>
								<li>TypeScript</li>
								<li>React</li>
								<li>TailwindCSS</li>
							</ul>
						</div>
					</div>
					<div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
						<p>&copy; 2024 节点管理后台. 专业的节点配置管理平台。</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
