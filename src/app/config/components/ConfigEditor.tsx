
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SubscribeUrlPanel } from './SubscribeUrlPanel';
import { ValidationMessage } from './ValidationMessage';
import { CheckCircle } from 'lucide-react';
import { ConfigForm } from './ConfigForm';
import { UserConfig } from '@/types/openapi-schemas';

interface ConfigEditorProps {
	uid: string;
	token: string;
	config: UserConfig | null;
	validationErrors: string[];
	onConfigChange: (config: UserConfig) => void;
}

export function ConfigEditor({
	uid,
	token,
	config,
	validationErrors,
	onConfigChange,
}: ConfigEditorProps) {
	if (!config) {
		return <div className="p-6 text-center text-gray-500">正在加载配置...</div>;
	}

	return (
		<Card className="w-full flex flex-col shadow-sm border border-gray-200 bg-white rounded-xl overflow-hidden">
			<CardHeader className="flex flex-row items-center justify-between px-6 py-4 bg-white space-y-0">
				<div className="flex flex-row items-center gap-4">
					<h3 className="text-lg font-bold text-gray-900">配置编辑器</h3>
					{validationErrors.length === 0 && (
						<div className="flex items-center text-xs font-medium text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-100">
							<CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-600" />
							配置格式正确
						</div>
					)}
				</div>
			</CardHeader>
			<Separator />

			<CardContent className="flex-1 flex flex-col min-h-0 p-0">
				{/* 验证消息 */}
				{validationErrors.length > 0 && (
					<div className="px-6 pt-6">
						<ValidationMessage validationErrors={validationErrors} />
					</div>
				)}

				{/* Form 编辑器区域 */}
				<div className="flex-1 relative border-y border-gray-100">
					<ConfigForm config={config} onChange={onConfigChange} />
				</div>

				{/* 底部操作区域 */}
				<div className="sticky bottom-0 left-0 right-0 z-20 flex-shrink-0 p-6 bg-gray-50/80 border-t border-gray-100 backdrop-blur-sm">
					<SubscribeUrlPanel uid={uid} token={token} />
				</div>
			</CardContent>
		</Card>
	);
}
