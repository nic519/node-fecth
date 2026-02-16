
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ValidationMessage } from './ValidationMessage';
import { ConfigForm, ConfigTab } from './ConfigForm';
import { UserConfig } from '@/types/openapi-schemas';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PanelPreview } from './PanelPreview';

interface ConfigEditorProps {
	uid: string;
	token: string;
	config: UserConfig | null;
	validationErrors: string[];
	onConfigChange: (config: UserConfig) => void;
	lastSaved?: Date | null;
}

export function ConfigEditor({
	uid,
	token,
	config,
	validationErrors,
	onConfigChange,
	lastSaved,
}: ConfigEditorProps) {
	const [activeTab, setActiveTab] = useState<ConfigTab>('basic');

	if (!config) {
		return <div className="p-6 text-center text-gray-500">正在加载配置...</div>;
	}

	return (
		<Card className="w-full flex flex-col shadow-sm border border-gray-200 bg-white rounded-xl overflow-hidden">
			<CardContent className="flex flex-col md:flex-row min-h-[600px] p-0">
				{/* Sidebar */}
				<div className="w-full md:w-64 border-r border-gray-100 bg-gray-50/50 p-4 space-y-2">
					<div className="mb-4 space-y-3 px-2">
						<div className="flex flex-col gap-1">
							<span className="text-xs text-gray-500 font-medium">用户ID</span>
							<Badge variant="secondary" className="font-mono bg-white border border-gray-200 text-gray-700 w-fit">
								{uid}
							</Badge>
						</div>

						{lastSaved && (
							<div className="flex flex-col gap-1">
								<span className="text-xs text-gray-500 font-medium">最后保存时间</span>
								<span className="text-xs text-gray-700 font-mono">
									{lastSaved.toLocaleString('zh-CN')}
								</span>
							</div>
						)}

					</div>
					<Separator className="mb-2" />
					<Button
						variant={activeTab === 'basic' ? 'secondary' : 'ghost'}
						className={cn('w-full justify-start', activeTab === 'basic' && 'bg-white shadow-sm')}
						onClick={() => setActiveTab('basic')}
					>
						📝 基础配置
					</Button>
					<Button
						variant={activeTab === 'rules' ? 'secondary' : 'ghost'}
						className={cn('w-full justify-start', activeTab === 'rules' && 'bg-white shadow-sm')}
						onClick={() => setActiveTab('rules')}
					>
						🛡️ 规则配置
					</Button>
					<Button
						variant={activeTab === 'dynamic' ? 'secondary' : 'ghost'}
						className={cn('w-full justify-start', activeTab === 'dynamic' && 'bg-white shadow-sm')}
						onClick={() => setActiveTab('dynamic')}
					>
						🔄 订阅加载
					</Button>
					<Button
						variant={activeTab === 'token' ? 'secondary' : 'ghost'}
						className={cn('w-full justify-start', activeTab === 'token' && 'bg-white shadow-sm')}
						onClick={() => setActiveTab('token')}
					>
						🔑 访问令牌
					</Button>

					<Separator className="my-2" />

					<Button
						variant={activeTab === 'preview' ? 'secondary' : 'ghost'}
						className={cn('w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50', activeTab === 'preview' && 'bg-blue-50 text-blue-700')}
						onClick={() => setActiveTab('preview')}
					>
						👀 预览结果
					</Button>
				</div>

				{/* Right Content */}
				<div className="flex-1 flex flex-col min-h-0 bg-white">
					{/* 验证消息 */}
					{validationErrors.length > 0 && (
						<div className="px-6 pt-6">
							<ValidationMessage validationErrors={validationErrors} />
						</div>
					)}

					{/* Form 编辑器区域 */}
					<div className="flex-1 relative h-full overflow-auto">
						{activeTab === 'preview' ? (
							<PanelPreview uid={uid} token={token} />
						) : (
							<ConfigForm config={config} onChange={onConfigChange} activeTab={activeTab} />
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
