import { useParams } from 'react-router-dom';
import { ConfigEditor } from './components/ConfigEditor';
import { Header } from './components/Header';
import { HelpSidebar } from './components/HelpSidebar';
import { useHelpDisplay } from './hooks/useHelpDisplay';
import { useUserConfig } from './hooks/useUserConfig';

export function UserConfigPage() {
	// 从 React Router 获取路由参数
	const { uid } = useParams<{ uid: string }>();

	// 从 URL 获取 token
	const token = new URLSearchParams(window.location.search).get('token') || '';

	// 确保 uid 存在
	if (!uid) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
					<h1 className="text-2xl font-bold text-red-600 mb-4">错误</h1>
					<p className="text-gray-600 mb-4">缺少用户ID参数</p>
				</div>
			</div>
		);
	}

	// 使用自定义 Hook 管理状态
	const userConfigState = useUserConfig({ uid, token });
	const { showHelp, toggleHelp } = useHelpDisplay();

	if (userConfigState.loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
					<p className="mt-4 text-gray-600">加载配置中...</p>
				</div>
			</div>
		);
	}

	if (userConfigState.error && !userConfigState.config) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
					<h1 className="text-2xl font-bold text-red-600 mb-4">错误</h1>
					<p className="text-gray-600 mb-4">{userConfigState.error}</p>
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
			<Header
				uid={uid}
				connectionStatus={userConfigState.connectionStatus}
				lastSaved={userConfigState.lastSaved}
				configSource={userConfigState.configSource}
				saving={userConfigState.saving}
				saveSuccess={userConfigState.saveSuccess}
				validationErrors={userConfigState.validationErrors}
				onSave={userConfigState.saveConfig}
			/>

			{/* 主内容 */}
			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<div className="flex flex-col lg:flex-row gap-6 lg:items-stretch min-h-[500px] max-h-[calc(100vh-200px)]">
						{/* 主要配置区域 */}
						<div className="flex-1 flex">
							<ConfigEditor
								uid={uid}
								token={token}
								configContent={userConfigState.configContent}
								validationErrors={userConfigState.validationErrors}
								configPreview={userConfigState.configPreview}
								onConfigContentChange={userConfigState.setConfigContent}
								onToggleHelp={toggleHelp}
							/>
						</div>

						{/* 侧边栏字段说明 */}
						<HelpSidebar showHelp={showHelp} onToggleHelp={toggleHelp} />
					</div>
				</div>
			</main>
		</div>
	);
}
