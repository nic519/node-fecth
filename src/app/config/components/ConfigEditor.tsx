
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SubscribeUrlPanel } from './SubscribeUrlPanel';
import { ValidationMessage } from './ValidationMessage';
import { CheckCircle } from 'lucide-react';
import { ConfigForm, ConfigTab } from './ConfigForm';
import { UserConfig } from '@/types/openapi-schemas';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { YamlEditor } from '@/components/YamlEditor';
import { Loader2 } from 'lucide-react';

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
	const [activeTab, setActiveTab] = useState<ConfigTab>('basic');
	const [origin, setOrigin] = useState('');
	const [previewContent, setPreviewContent] = useState('');
	const [previewLoading, setPreviewLoading] = useState(false);
	const [previewError, setPreviewError] = useState('');

	useEffect(() => {
		setOrigin(window.location.origin);
	}, []);

	const handlePreviewSubscribeURL = async () => {
		if (origin) {
			const subscribeURL = `${origin}/api/x?uid=${uid}&token=${token}`;
			setActiveTab('preview');
			setPreviewLoading(true);
			setPreviewError('');
			try {
				const response = await fetch(subscribeURL);
				if (!response.ok) {
					throw new Error(`Failed to fetch: ${response.statusText}`);
				}
				const text = await response.text();
				setPreviewContent(text);
			} catch (error) {
				console.error('Preview fetch error:', error);
				setPreviewError('获取预览内容失败，请稍后重试。');
			} finally {
				setPreviewLoading(false);
			}
		}
	};

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
				<SubscribeUrlPanel uid={uid} token={token} />
			</CardHeader>
			<Separator />

			<CardContent className="flex flex-col md:flex-row min-h-[600px] p-0">
				{/* Sidebar */}
				<div className="w-full md:w-64 border-r border-gray-100 bg-gray-50/50 p-4 space-y-2">
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
						🔄 动态管理
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
						onClick={handlePreviewSubscribeURL}
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
							<div className="h-full flex flex-col p-6">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-lg font-medium">配置预览</h3>
									<Button
										variant="outline"
										size="sm"
										onClick={handlePreviewSubscribeURL}
										disabled={previewLoading}
									>
										{previewLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
										刷新
									</Button>
								</div>

								{previewLoading ? (
									<div className="flex-1 flex items-center justify-center border rounded-md bg-gray-50">
										<div className="flex flex-col items-center gap-2 text-gray-500">
											<Loader2 className="w-8 h-8 animate-spin" />
											<span>正在生成配置...</span>
										</div>
									</div>
								) : previewError ? (
									<div className="flex-1 flex items-center justify-center border rounded-md bg-red-50 text-red-500">
										<p>{previewError}</p>
									</div>
								) : (
									<div className="flex-1 border rounded-md overflow-hidden">
										<YamlEditor
											value={previewContent}
											onChange={() => { }}
											readOnly={true}
											height="100%"
										/>
									</div>
								)}
							</div>
						) : (
							<ConfigForm config={config} onChange={onConfigChange} activeTab={activeTab} />
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
