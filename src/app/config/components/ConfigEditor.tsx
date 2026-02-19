
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ValidationMessage } from './ValidationMessage';
import { ConfigForm, ConfigTab } from './ConfigForm';
import { UserConfig } from '@/types/openapi-schemas';
import { PanelPreview } from './PanelPreview';
import { User, Clock, CloudUpload, CheckCircle2, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SubscribeUrlPanel } from './SubscribeUrlPanel';

interface ConfigEditorProps {
	uid: string;
	token: string;
	config: UserConfig | null;
	validationErrors: string[];
	onConfigChange: (config: UserConfig) => void;
	lastSaved?: Date | null;
	activeTab: ConfigTab;
	onSave: () => void;
	saving: boolean;
	saveSuccess: boolean;
}

export function ConfigEditor({
	uid,
	token,
	config,
	validationErrors,
	onConfigChange,
	lastSaved,
	activeTab,
	onSave,
	saving,
	saveSuccess,
}: ConfigEditorProps) {

	if (!config) {
		return <div className="p-6 text-center text-gray-500">正在加载配置...</div>;
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
			{/* Sidebar - Fixed Left Panel */}
			<div className="w-full md:col-span-1 sticky top-24 space-y-4">
				<Card className="shadow-lg shadow-primary/5 border border-border/60 overflow-hidden relative">
					<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-violet-400" />
					<CardHeader className="pb-3">

					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-3">
							<div className="p-2.5 bg-primary/10 rounded-xl">
								<User className="h-5 w-5 text-primary" />
							</div>
							<div className="flex flex-col">
								<span className="text-xs font-medium text-muted-foreground">用户ID</span>
								<span className="font-mono font-medium text-foreground tracking-tight">{uid}</span>
							</div>
						</div>

						{validationErrors.length === 0 && (
							<>
								<Separator className="bg-border/60" />
								<div className="flex items-center gap-3">
									<div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
										<CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-500 animate-[pulse_3s_ease-in-out_infinite]" />
									</div>
									<div className="flex flex-col">
										<span className="text-xs font-medium text-muted-foreground">配置状态</span>
										<span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">格式正确</span>
									</div>
								</div>
							</>
						)}

						{lastSaved && (
							<>
								<Separator className="bg-border/60" />
								<div className="flex items-center gap-3">
									<div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
										<Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
									</div>
									<div className="flex flex-col">
										<span className="text-xs font-medium text-muted-foreground">最后保存</span>
										<span className="text-xs font-mono text-foreground">
											{lastSaved.toLocaleString('zh-CN', {
												year: 'numeric',
												month: 'numeric',
												day: 'numeric',
												hour: 'numeric',
												minute: 'numeric'
											})}
										</span>
									</div>
								</div>
							</>
						)}

						<div className="space-y-3 pt-2">
							<Button
								onClick={onSave}
								disabled={saving || validationErrors.length > 0}
								className={cn(
									"w-full font-bold shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]",
									saveSuccess
										? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/25"
										: "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40"
								)}
							>
								{saving ? (
									<Loader2 className="w-4 h-4 animate-spin mr-2" />
								) : saveSuccess ? (
									<CheckCircle2 className="w-4 h-4 mr-2" />
								) : (
									<CloudUpload className="w-4 h-4 mr-2" />
								)}
								{saving ? '保存中...' : saveSuccess ? '保存成功' : '保存配置'}
							</Button>

							<div className="pt-1">
								<SubscribeUrlPanel uid={uid} token={token} />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Right Content */}
			<div className="md:col-span-3 min-h-[600px] h-full">
				<Card className="shadow-sm border border-border/60 h-full flex flex-col bg-card/50 backdrop-blur-sm">
					<CardContent className="p-6 flex-1 flex flex-col min-h-0">
						{/* 验证消息 */}
						{validationErrors.length > 0 && (
							<div className="mb-6 flex-shrink-0">
								<ValidationMessage validationErrors={validationErrors} />
							</div>
						)}

						{/* Form 编辑器区域 */}
						<div className="flex-1 min-h-0">
							{activeTab === 'preview' ? (
								<PanelPreview uid={uid} token={token} />
							) : (
								<ConfigForm config={config} onChange={onConfigChange} activeTab={activeTab} uid={uid} />
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
