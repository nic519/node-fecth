import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { YamlEditor } from '@/components/YamlEditor';
import { PanelTopBar } from './PanelTopBar';

interface PreviewPanelProps {
	uid: string;
	token: string;
}

export function PanelPreview({ uid, token }: PreviewPanelProps) {
	const [origin, setOrigin] = useState('');
	const [previewContent, setPreviewContent] = useState('');
	const [previewLoading, setPreviewLoading] = useState(false);
	const [previewError, setPreviewError] = useState('');

	useEffect(() => {
		setOrigin(window.location.origin);
	}, []);

	const handlePreviewSubscribeURL = useCallback(async () => {
		if (!origin) return;
		const subscribeURL = `${origin}/api/x?uid=${uid}&token=${token}`;
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
	}, [origin, uid, token]);

	// Initial load when origin is ready
	useEffect(() => {
		if (origin) {
			void handlePreviewSubscribeURL();
		}
	}, [origin, handlePreviewSubscribeURL]);

	return (
		<div className="h-[calc(100vh-12rem)] min-h-[600px] flex flex-col">
			<PanelTopBar
				className="mb-4"
				description="查看最终生成的 YAML 输出。"
				right={
					<Button
						variant="outline"
						size="sm"
						onClick={handlePreviewSubscribeURL}
						disabled={previewLoading}
						className="h-8 gap-2 bg-background hover:bg-accent hover:text-accent-foreground transition-all"
					>
						{previewLoading ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							<RefreshCw className="w-3.5 h-3.5" />
						)}
						刷新
					</Button>
				}
			/>

			{previewLoading && !previewContent ? (
				<div className="flex-1 flex items-center justify-center rounded-xl bg-muted/10 p-8">
					<div className="flex flex-col items-center gap-4 text-muted-foreground">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
						<span className="font-medium animate-pulse">正在生成配置...</span>
					</div>
				</div>
			) : previewError ? (
				<div className="flex-1 flex items-center justify-center border border-destructive/20 rounded-xl bg-destructive/5 text-destructive p-8">
					<div className="flex flex-col items-center gap-2">
						<span className="font-medium">生成失败</span>
						<p className="text-sm opacity-90">{previewError}</p>
					</div>
				</div>
			) : (
				<div className="flex-1 overflow-hidden relative">
					{/* Add a loading overlay if reloading */}
					{previewLoading && (
						<div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[1px] transition-all duration-300">
							<div className="bg-background/80 p-3 rounded-full shadow-lg border border-border/40">
								<Loader2 className="w-5 h-5 animate-spin text-primary" />
							</div>
						</div>
					)}
					<YamlEditor
						value={previewContent}
						onChange={() => { }}
						readOnly={true}
						height="100%"
						transparent={true}
						bordered={false}
						className="bg-transparent"
					/>
				</div>
			)}
		</div>
	);
}
