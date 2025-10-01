import Loading from '@/components/Loading';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ConfigEditor } from './components/ConfigEditor';
import { Header } from './components/Header';
import { HelpSidebar } from './components/HelpSidebar';
import { useHelpDisplay } from './hooks/useHelpDisplay';
import { useUserConfig } from './hooks/useUserConfig';
import { Card, Button } from '@heroui/react';

export function UserConfigPage() {
	// 设置页面标题
	usePageTitle('配置订阅');

	// 从 URL 获取 token
	const token = new URLSearchParams(window.location.search).get('token') || '';
	const uid = new URLSearchParams(window.location.search).get('uid') || '';

	// 确保 uid 存在
	if (!uid) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="max-w-md w-full p-6">
					<h1 className="text-2xl font-bold text-danger mb-4">错误</h1>
					<p className="text-default-600 mb-4">缺少用户ID参数</p>
				</Card>
			</div>
		);
	}

	// 使用自定义 Hook 管理状态
	const userConfigState = useUserConfig({ uid, token });
	const { showHelp, toggleHelp } = useHelpDisplay();

	return (
		<div className="min-h-screen">
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
			<main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
				{/* 加载状态 */}
				{userConfigState.loading ? (
					<div className="flex items-center justify-center py-20">
						<Loading message="加载配置中..." />
					</div>
				) : userConfigState.error && !userConfigState.config ? (
					<div className="flex items-center justify-center py-20">
						<Card className="max-w-md w-full p-6">
							<h1 className="text-2xl font-bold text-danger mb-4">错误</h1>
							<p className="text-default-600 mb-4">{userConfigState.error}</p>
							<Button
								onClick={() => window.location.reload()}
								color="primary"
								className="w-full"
							>
								重试
							</Button>
						</Card>
					</div>
				) : (
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
				)}
			</main>
		</div>
	);
}
