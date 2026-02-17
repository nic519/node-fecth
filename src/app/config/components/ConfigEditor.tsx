
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ValidationMessage } from './ValidationMessage';
import { ConfigForm, ConfigTab } from './ConfigForm';
import { UserConfig } from '@/types/openapi-schemas';
import { PanelPreview } from './PanelPreview';
import { User, Clock, CloudUpload, CheckCircle2, Loader2 } from 'lucide-react';
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
				<Card className="shadow-sm border border-gray-200">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">用户信息</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-blue-50 rounded-lg">
								<User className="h-5 w-5 text-blue-600" />
							</div>
							<div className="flex flex-col">
								<span className="text-xs text-gray-500">用户ID</span>
								<span className="font-mono font-medium text-gray-900">{uid}</span>
							</div>
						</div>

						{lastSaved && (
							<>
								<Separator />
								<div className="flex items-center gap-3">
									<div className="p-2 bg-green-50 rounded-lg">
										<Clock className="h-5 w-5 text-green-600" />
									</div>
									<div className="flex flex-col">
										<span className="text-xs text-gray-500">最后保存</span>
										<span className="text-xs font-mono text-gray-900">
											{lastSaved.toLocaleString('zh-CN', {
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

						<Separator />

						<div className="space-y-3">
							<Button
								onClick={onSave}
								disabled={saving || validationErrors.length > 0}
								className={cn(
									"w-full font-medium shadow-sm transition-all",
									saveSuccess ? "bg-green-600 hover:bg-green-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
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
				<Card className="shadow-sm border border-gray-200 h-full flex flex-col">
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
