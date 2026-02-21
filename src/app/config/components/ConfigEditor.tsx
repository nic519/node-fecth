
import { Card, CardContent } from '@/components/ui/card';
import { ValidationMessage } from './ValidationMessage';
import { ConfigForm, ConfigTab } from './ConfigForm';
import { UserConfig } from '@/types/openapi-schemas';
import { PanelPreview } from './PanelPreview';
import { ConfigSidebar } from './ConfigSidebar';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Menu } from 'lucide-react';

interface ConfigEditorProps {
	uid: string;
	token: string;
	config: UserConfig | null;
	validationErrors: string[];
	onConfigChange: (config: UserConfig) => void;
	lastSaved?: Date | null;
	activeTab: ConfigTab;
	onTabChange: (tab: ConfigTab) => void;
	onSave: () => void;
	saving: boolean;
	saveSuccess: boolean;
	loading?: boolean;
	error?: string | null;
}

export function ConfigEditor({
	uid,
	token,
	config,
	validationErrors,
	onConfigChange,
	lastSaved,
	activeTab,
	onTabChange,
	onSave,
	saving,
	saveSuccess,
	loading,
	error,
}: ConfigEditorProps) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	return (
		<div className="flex min-h-screen w-full bg-slate-50/50 dark:bg-zinc-950 relative">
			{/* Background Gradient */}
			<div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-zinc-950 [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#09090b_40%,#1e1b4b_100%)] opacity-20 pointer-events-none" />

			{/* Mobile Menu Button */}
			<Button
				variant="ghost"
				size="icon"
				className="fixed top-4 left-4 z-40 md:hidden bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-border/20 shadow-sm hover:bg-white/80 dark:hover:bg-black/80"
				onClick={() => setIsSidebarOpen(true)}
			>
				<Menu className="h-5 w-5" />
			</Button>

			{/* Fixed Sidebar */}
			<ConfigSidebar
				uid={uid}
				token={token}
				activeTab={activeTab}
				onTabChange={(tab) => {
					onTabChange(tab);
					setIsSidebarOpen(false);
				}}
				validationErrors={validationErrors}
				lastSaved={lastSaved}
				onSave={onSave}
				saving={saving}
				saveSuccess={saveSuccess}
				isOpen={isSidebarOpen}
				onClose={() => setIsSidebarOpen(false)}
			/>

			{/* Main Content Area - pushed right by sidebar width (w-72) */}
			<main className="flex-1 ml-0 md:ml-72 p-6 md:p-8 min-h-screen transition-all duration-300">
				<div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

					{loading ? (
						<div className="flex items-center justify-center min-h-[50vh]">
							<Loading message="加载配置中..." />
						</div>
					) : error ? (
						<div className="flex items-center justify-center min-h-[50vh]">
							<Card className="max-w-md w-full shadow-lg border-destructive/20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
								<CardContent className="p-6 text-center">
									<h1 className="text-2xl font-bold text-destructive mb-4">加载失败</h1>
									<p className="text-muted-foreground mb-6">{error}</p>
									<Button
										onClick={() => window.location.reload()}
										variant="default"
										className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
									>
										重试
									</Button>
								</CardContent>
							</Card>
						</div>
					) : config ? (
						<>
							{/* Validation Messages */}
							{validationErrors.length > 0 && (
								<div className="mb-6">
									<ValidationMessage validationErrors={validationErrors} />
								</div>
							)}

							{/* Content Card */}
							<Card className="shadow-lg shadow-black/5 border border-border/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-900/60 overflow-hidden">
								{/* Colorful top border for accent */}
								<div className="h-1 w-full bg-gradient-to-r from-primary via-violet-500 to-indigo-500 opacity-80" />

								<CardContent className="p-6 md:p-8">
									{activeTab === 'preview' ? (
										<PanelPreview uid={uid} token={token} />
									) : (
										<ConfigForm
											config={config}
											onChange={onConfigChange}
											activeTab={activeTab}
											uid={uid}
										/>
									)}
								</CardContent>
							</Card>
						</>
					) : (
						<div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
							暂无配置数据
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
