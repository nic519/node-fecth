import { userConfigApi } from '@/generated/api-client';
import type { ConfigResponse, UserConfig } from '@/types/user-config';
import { useEffect, useState } from 'preact/hooks';

interface UserConfigPageProps {
	uid: string;
}

export function UserConfigPage({ uid }: UserConfigPageProps) {
	const [config, setConfig] = useState<ConfigResponse | null>(null);
	const [configContent, setConfigContent] = useState('');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [copySuccess, setCopySuccess] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const [hasUserInteracted, setHasUserInteracted] = useState(false);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);
	const [configPreview, setConfigPreview] = useState<any>(null);
	const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [configSource, setConfigSource] = useState<string>('');

	// 从 URL 获取 token
	const token = new URLSearchParams(window.location.search).get('token') || '';
	const subscribeURL = `${window.location.origin}/${uid}?token=${token}`;

	// 响应式控制：大屏幕默认显示帮助，小屏幕默认隐藏
	useEffect(() => {
		const checkScreenSize = () => {
			if (!hasUserInteracted) {
				setShowHelp(window.innerWidth >= 1024);
			}
		};

		checkScreenSize();
		window.addEventListener('resize', checkScreenSize);
		return () => window.removeEventListener('resize', checkScreenSize);
	}, [hasUserInteracted]);

	// 加载配置数据
	useEffect(() => {
		if (!token) {
			setError('缺少访问令牌');
			setLoading(false);
			return;
		}

		loadConfig();
	}, [uid, token]);

	const loadConfig = async () => {
		try {
			setLoading(true);
			const response = await userConfigApi.getDetail(uid, token);
			
			// 检查响应状态
			if (response.code !== 0) {
				setError(response.msg || '获取配置失败');
				return;
			}
			
			// 从新的响应结构中提取配置数据
			const configData = response.data;
			setConfig(configData);
			setConfigSource((configData.meta as any).source || '环境变量');

			// 将配置转换为 YAML 格式显示
			const yamlContent = configToYaml(configData.config);
			setConfigContent(yamlContent);
			validateConfig(yamlContent);
			setError(null);
			setConnectionStatus('connected');
		} catch (err) {
			setError(err instanceof Error ? err.message : '加载配置失败');
			setConnectionStatus('disconnected');
		} finally {
			setLoading(false);
		}
	};

	const saveConfig = async () => {
		if (validationErrors.length > 0) return;

		try {
			setSaving(true);
			setError(null);

			// 解析 YAML 配置
			const newConfig = yamlToConfig(configContent);

			const response = await userConfigApi.update(uid, newConfig, token);
			
			// 检查响应是否成功
			if (response.code === 0) {
				setSaveSuccess(true);
				setLastSaved(new Date());
				setTimeout(() => setSaveSuccess(false), 3000);
			} else {
				setError(response.msg || '保存配置失败');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : '保存配置失败');
		} finally {
			setSaving(false);
		}
	};

	const validateConfig = (yaml: string) => {
		const errors: string[] = [];

		try {
			const lines = yaml.split('\n');
			const hasSubscribe = lines.some((line) => line.trim().startsWith('subscribe:'));
			const hasAccessToken = lines.some((line) => line.trim().startsWith('accessToken:'));

			if (!hasSubscribe) {
				errors.push('缺少必需字段: subscribe');
			}
			if (!hasAccessToken) {
				errors.push('缺少必需字段: accessToken');
			}

			// 简单的 YAML 语法检查
			lines.forEach((line, index) => {
				if (line.trim() && line.includes(':') && !line.trim().startsWith('#')) {
					const colonIndex = line.indexOf(':');
					if (colonIndex === 0) {
						errors.push(`第 ${index + 1} 行: 字段名不能为空`);
					}
				}
			});

			if (errors.length === 0) {
				setConfigPreview(yamlToConfig(yaml));
			} else {
				setConfigPreview(null);
			}
		} catch (err) {
			errors.push('YAML 格式错误');
			setConfigPreview(null);
		}

		setValidationErrors(errors);
	};

	const copySubscribeURL = async () => {
		try {
			await navigator.clipboard.writeText(subscribeURL);
			setCopySuccess(true);
			setTimeout(() => setCopySuccess(false), 2000);
		} catch (err) {
			console.error('复制失败:', err);
		}
	};

	const formatTime = (date: Date) => {
		return date.toLocaleString('zh-CN', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	// 配置转换函数
	const configToYaml = (config: UserConfig): string => {
		let yaml = `subscribe: "${config.subscribe}"\naccessToken: "${config.accessToken}"`;

		if (config.ruleUrl) yaml += `\nruleUrl: "${config.ruleUrl}"`;
		if (config.fileName) yaml += `\nfileName: "${config.fileName}"`;

		if (config.multiPortMode && config.multiPortMode.length > 0) {
			yaml += `\nmultiPortMode:\n${config.multiPortMode.map((area) => `  - ${area}`).join('\n')}`;
		}

		if (config.excludeRegex) yaml += `\nexcludeRegex: "${config.excludeRegex}"`;

		if (config.appendSubList && config.appendSubList.length > 0) {
			yaml += `\nappendSubList:`;
			config.appendSubList.forEach((sub) => {
				yaml += `\n  - subscribe: "${sub.subscribe}"`;
				yaml += `\n    flag: "${sub.flag}"`;
				if (sub.includeArea && sub.includeArea.length > 0) {
					yaml += `\n    includeArea:\n${sub.includeArea.map((area) => `      - ${area}`).join('\n')}`;
				}
			});
		}

		return yaml;
	};

	// YAML 解析函数
	const yamlToConfig = (yaml: string): UserConfig => {
		const lines = yaml.split('\n');
		const config: any = {};
		let currentArray: string | null = null;
		let currentObject: any = null;
		let isInAppendSub = false;

		lines.forEach((line) => {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) return;

			if (trimmed.includes(':')) {
				const [key, ...valueParts] = trimmed.split(':');
				const value = valueParts.join(':').trim();

				if (key === 'multiPortMode' || key === 'appendSubList') {
					currentArray = key;
					config[key] = [];
					isInAppendSub = key === 'appendSubList';
				} else if (line.startsWith('  - ')) {
					if (currentArray === 'multiPortMode' && currentArray) {
						config[currentArray].push(key.replace('- ', '').trim());
					} else if (isInAppendSub && key === '- subscribe' && currentArray) {
						currentObject = { subscribe: value.replace(/"/g, '') };
						config[currentArray].push(currentObject);
					}
				} else if (line.startsWith('    ')) {
					if (currentObject && key === 'flag') {
						currentObject.flag = value.replace(/"/g, '');
					} else if (currentObject && key === 'includeArea') {
						currentObject.includeArea = [];
					}
				} else if (line.startsWith('      - ') && currentObject && currentObject.includeArea) {
					currentObject.includeArea.push(key.replace('- ', '').trim());
				} else {
					currentArray = null;
					isInAppendSub = false;
					currentObject = null;
					if (value.startsWith('"') && value.endsWith('"')) {
						config[key.trim()] = value.slice(1, -1);
					} else if (value) {
						config[key.trim()] = value;
					}
				}
			}
		});

		return config as UserConfig;
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
					<p className="mt-4 text-gray-600">加载配置中...</p>
				</div>
			</div>
		);
	}

	if (error && !config) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
					<h1 className="text-2xl font-bold text-red-600 mb-4">错误</h1>
					<p className="text-gray-600 mb-4">{error}</p>
					<button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
						重试
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* 头部 */}
			<header className="bg-white border-b border-gray-200 shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<h1 className="text-xl font-semibold text-gray-900">配置管理</h1>
							</div>
							<div className="hidden md:block ml-10">
								<div className="flex items-baseline space-x-4">
									<span className="text-sm text-gray-500">
										用户ID: <span className="font-medium text-gray-900">{uid}</span>
									</span>
									<div className="flex items-center">
										<div className={`w-2 h-2 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'}`}></div>
										<span className={`text-sm ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
											{connectionStatus === 'connected' ? '已连接' : '连接失败'}
										</span>
									</div>
								</div>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<div className="text-right">
								<div className="text-sm text-gray-500">{lastSaved ? `最后保存: ${formatTime(lastSaved)}` : '未保存'}</div>
								<div className="text-xs text-gray-400">数据源: {configSource}</div>
							</div>
							<button
								onClick={saveConfig}
								disabled={saving || validationErrors.length > 0}
								className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
									saveSuccess
										? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
										: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
								}`}
							>
								{saving && (
									<svg
										className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
								)}
								{!saving && !saveSuccess && (
									<svg
										className="h-4 w-4 mr-2 transition-opacity duration-200"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
										/>
									</svg>
								)}
								{saveSuccess && (
									<svg
										className="h-4 w-4 mr-2 transition-opacity duration-200"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
								)}
								<span>{saving ? '保存中...' : saveSuccess ? '保存成功！' : '保存'}</span>
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* 主内容 */}
			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<div className="flex flex-col lg:flex-row gap-6 lg:items-stretch min-h-[500px] max-h-[calc(100vh-200px)]">
						{/* 主要配置区域 */}
						<div className="flex-1 flex">
							<div className="bg-white shadow rounded-lg w-full flex flex-col">
								<div className="px-4 py-5 sm:p-6 flex-1 flex flex-col min-h-0">
									<div className="flex items-center justify-between mb-4 flex-shrink-0">
										<div>
											<h3 className="text-lg leading-6 font-medium text-gray-900">YAML 配置</h3>
											<p className="mt-1 text-sm text-gray-500">编辑您的用户配置，保存后立即生效</p>
										</div>
										<button
											onClick={() => {
												setHasUserInteracted(true);
												setShowHelp(!showHelp);
											}}
											className="lg:hidden inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
										>
											<svg
												className="h-4 w-4 mr-2"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											字段说明
										</button>
									</div>

									{/* 验证错误提示 */}
									{validationErrors.length > 0 && (
										<div className="mb-4 rounded-md bg-red-50 p-4 flex-shrink-0">
											<div className="flex">
												<div className="flex-shrink-0">
													<svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
														<path
															fill-rule="evenodd"
															d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
															clip-rule="evenodd"
														/>
													</svg>
												</div>
												<div className="ml-3">
													<h3 className="text-sm font-medium text-red-800">配置验证失败</h3>
													<div className="mt-2 text-sm text-red-700">
														<ul className="list-disc pl-5 space-y-1">
															{validationErrors.map((error, index) => (
																<li key={index}>{error}</li>
															))}
														</ul>
													</div>
												</div>
											</div>
										</div>
									)}

									{/* 验证成功提示 */}
									{validationErrors.length === 0 && configPreview && (
										<div className="mb-4 rounded-md bg-green-50 p-4 flex-shrink-0">
											<div className="flex">
												<div className="flex-shrink-0">
													<svg
														className="h-5 w-5 text-green-400"
														xmlns="http://www.w3.org/2000/svg"
														viewBox="0 0 20 20"
														fill="currentColor"
													>
														<path
															fill-rule="evenodd"
															d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
															clip-rule="evenodd"
														/>
													</svg>
												</div>
												<div className="ml-3">
													<p className="text-sm font-medium text-green-800">配置格式正确</p>
												</div>
											</div>
										</div>
									)}

									{/* 文本编辑区域 */}
									<div className="flex-1 flex flex-col min-h-0 mb-6">
										<textarea
											value={configContent}
											onChange={(e) => {
												const value = (e.target as HTMLTextAreaElement).value;
												setConfigContent(value);
												validateConfig(value);
											}}
											className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono resize-none min-h-[300px]"
											placeholder="YAML 配置将在这里显示..."
											spellcheck={false}
										/>
									</div>

									{/* 底部操作区域 */}
									<div className="flex-shrink-0">
										<div className="flex items-center justify-between mb-4">
											<div className="flex items-center text-sm text-gray-500">
												<svg
													className="mr-1.5 h-4 w-4"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
													/>
												</svg>
												支持 YAML 格式，保存前会自动验证
											</div>
										</div>
										<div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
											<div className="flex items-center space-x-2 flex-shrink-0">
												<svg
													className="h-5 w-5 text-gray-500"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
													/>
												</svg>
												<span className="text-sm font-medium text-gray-700">固定链接：</span>
											</div>
											<div className="flex-1 min-w-0 w-full sm:w-auto">
												<a
													href={subscribeURL}
													target="_blank"
													className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors duration-200 truncate text-center sm:text-left"
												>
													{subscribeURL}
												</a>
											</div>
											<button
												onClick={copySubscribeURL}
												className={`inline-flex items-center justify-center px-4 py-2 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 w-full sm:w-auto flex-shrink-0 ${
													copySuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'
												}`}
											>
												{!copySuccess && (
													<svg
														className="h-4 w-4 mr-2 transition-opacity duration-200"
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
														/>
													</svg>
												)}
												{copySuccess && (
													<svg
														className="h-4 w-4 mr-2 transition-opacity duration-200"
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
													</svg>
												)}
												<span>{copySuccess ? '已复制！' : '复制链接'}</span>
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* 侧边栏字段说明 */}
						{showHelp && (
							<div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl lg:relative lg:inset-auto lg:w-80 lg:flex-shrink-0 lg:shadow-md lg:rounded-lg animate-in slide-in-from-right duration-300 lg:animate-none">
								<div className="h-full flex flex-col">
									<div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
										<h4 className="text-lg font-medium text-gray-900">配置字段说明</h4>
										<button
											onClick={() => {
												setHasUserInteracted(true);
												setShowHelp(false);
											}}
											className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
										>
											<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</div>

									<div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
										<div>
											<h5 className="font-medium text-gray-800 mb-3 flex items-center sticky top-0 bg-white py-2 -mt-2">
												<div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
												基础配置
											</h5>
											<div className="space-y-3 ml-4">
												<div className="border-l-2 border-blue-100 pl-3">
													<div className="flex items-center gap-2 mb-1">
														<span className="font-mono bg-blue-50 px-2 py-1 rounded text-xs text-blue-700">subscribe</span>
														<span className="text-xs text-red-600 font-medium">*必需</span>
													</div>
													<p className="text-gray-600 text-xs">订阅地址 - 您的节点订阅链接</p>
												</div>
												<div className="border-l-2 border-blue-100 pl-3">
													<div className="flex items-center gap-2 mb-1">
														<span className="font-mono bg-blue-50 px-2 py-1 rounded text-xs text-blue-700">accessToken</span>
														<span className="text-xs text-red-600 font-medium">*必需</span>
													</div>
													<p className="text-gray-600 text-xs">访问令牌 - 用于身份验证</p>
												</div>
												<div className="border-l-2 border-gray-100 pl-3">
													<div className="flex items-center gap-2 mb-1">
														<span className="font-mono bg-gray-50 px-2 py-1 rounded text-xs text-gray-700">ruleUrl</span>
														<span className="text-xs text-gray-500">可选</span>
													</div>
													<p className="text-gray-600 text-xs">规则模板链接 - 自定义规则配置文件地址</p>
												</div>
												<div className="border-l-2 border-gray-100 pl-3">
													<div className="flex items-center gap-2 mb-1">
														<span className="font-mono bg-gray-50 px-2 py-1 rounded text-xs text-gray-700">fileName</span>
														<span className="text-xs text-gray-500">可选</span>
													</div>
													<p className="text-gray-600 text-xs">文件名 - 生成配置文件的名称</p>
												</div>
											</div>
										</div>

										<div>
											<h5 className="font-medium text-gray-800 mb-3 flex items-center sticky top-0 bg-white py-2 -mt-2">
												<div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
												高级配置
											</h5>
											<div className="space-y-3 ml-4">
												<div className="border-l-2 border-gray-100 pl-3">
													<div className="flex items-center gap-2 mb-1">
														<span className="font-mono bg-gray-50 px-2 py-1 rounded text-xs text-gray-700">multiPortMode</span>
														<span className="text-xs text-gray-500">可选</span>
													</div>
													<p className="text-gray-600 text-xs mb-2">多出口模式 - 指定需要多出口的地区</p>
													<div className="bg-gray-50 p-2 rounded text-xs">
														<p className="text-gray-500 mb-1">支持的地区代码：</p>
														<div className="grid grid-cols-2 gap-1 text-xs">
															<span>TW (台湾)</span>
															<span>SG (新加坡)</span>
															<span>JP (日本)</span>
															<span>VN (越南)</span>
															<span>HK (香港)</span>
															<span>US (美国)</span>
														</div>
													</div>
													<div className="mt-2 bg-blue-50 p-2 rounded font-mono text-xs text-blue-700">
														multiPortMode:
														<br />
														&nbsp;&nbsp;- TW
														<br />
														&nbsp;&nbsp;- SG
													</div>
												</div>
												<div className="border-l-2 border-gray-100 pl-3">
													<div className="flex items-center gap-2 mb-1">
														<span className="font-mono bg-gray-50 px-2 py-1 rounded text-xs text-gray-700">excludeRegex</span>
														<span className="text-xs text-gray-500">可选</span>
													</div>
													<p className="text-gray-600 text-xs mb-2">排除节点的正则表达式 - 在多端口和多订阅模式下有效</p>
													<div className="bg-blue-50 p-2 rounded font-mono text-xs text-blue-700">
														excludeRegex: "(?i)(测试|trial|expire)"
													</div>
												</div>
											</div>
										</div>

										<div>
											<h5 className="font-medium text-gray-800 mb-3 flex items-center sticky top-0 bg-white py-2 -mt-2">
												<div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
												追加订阅配置
											</h5>
											<div className="space-y-3 ml-4">
												<div className="border-l-2 border-gray-100 pl-3">
													<div className="flex items-center gap-2 mb-1">
														<span className="font-mono bg-gray-50 px-2 py-1 rounded text-xs text-gray-700">appendSubList</span>
														<span className="text-xs text-gray-500">可选</span>
													</div>
													<p className="text-gray-600 text-xs mb-2">追加订阅列表 - 添加额外的订阅源</p>
													<div className="bg-blue-50 p-2 rounded font-mono text-xs text-blue-700">
														appendSubList:
														<br />
														&nbsp;&nbsp;- subscribe: "https://example.com/sub1"
														<br />
														&nbsp;&nbsp;&nbsp;&nbsp;flag: "provider1"
														<br />
														&nbsp;&nbsp;&nbsp;&nbsp;includeArea:
														<br />
														&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- TW
														<br />
														&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- HK
													</div>
													<div className="mt-2 space-y-1 text-xs">
														<div className="flex items-center gap-2">
															<span className="font-mono bg-gray-100 px-1 rounded">subscribe</span>
															<span className="text-red-600">必需</span>
															<span className="text-gray-600">- 订阅链接</span>
														</div>
														<div className="flex items-center gap-2">
															<span className="font-mono bg-gray-100 px-1 rounded">flag</span>
															<span className="text-red-600">必需</span>
															<span className="text-gray-600">- 标识名称</span>
														</div>
														<div className="flex items-center gap-2">
															<span className="font-mono bg-gray-100 px-1 rounded">includeArea</span>
															<span className="text-gray-500">可选</span>
															<span className="text-gray-600">- 包含的地区</span>
														</div>
													</div>
												</div>
											</div>
										</div>

										<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
											<h5 className="font-medium text-yellow-800 mb-2 text-sm">完整配置示例</h5>
											<div className="bg-yellow-100 p-3 rounded font-mono text-xs text-yellow-700 overflow-x-auto">
												subscribe: "https://example.com/subscribe"
												<br />
												accessToken: "your-token-here"
												<br />
												ruleUrl: "https://example.com/rules.yaml"
												<br />
												fileName: "config.yaml"
												<br />
												multiPortMode:
												<br />
												&nbsp;&nbsp;- TW
												<br />
												&nbsp;&nbsp;- HK
												<br />
												excludeRegex: "(?i)(test|trial)"
												<br />
												appendSubList:
												<br />
												&nbsp;&nbsp;- subscribe: "https://sub1.example.com"
												<br />
												&nbsp;&nbsp;&nbsp;&nbsp;flag: "backup"
												<br />
												&nbsp;&nbsp;&nbsp;&nbsp;includeArea:
												<br />
												&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- SG
											</div>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
