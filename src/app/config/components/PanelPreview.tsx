import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { YamlEditor } from '@/components/YamlEditor';

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
		<div className="h-full flex flex-col">
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

			{previewLoading && !previewContent ? (
				<div className="flex-1 flex items-center justify-center border rounded-md bg-gray-50 p-8">
					<div className="flex flex-col items-center gap-4 text-gray-500">
						<Loader2 className="w-8 h-8 animate-spin" />
						<span className="font-medium">正在生成配置...</span>
					</div>
				</div>
			) : previewError ? (
				<div className="flex-1 flex items-center justify-center border rounded-md bg-red-50 text-red-500">
					<p>{previewError}</p>
				</div>
			) : (
				<div className="flex-1 border rounded-md overflow-hidden relative">
					{/* Add a loading overlay if reloading */}
					{previewLoading && (
						<div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[1px] rounded-md">
							<div className="bg-white/80 p-4 rounded-full shadow-sm">
								<Loader2 className="w-6 h-6 animate-spin text-primary" />
							</div>
						</div>
					)}
					<YamlEditor
						value={previewContent}
						onChange={() => { }}
						readOnly={true}
						height="100%"
					/>
				</div>
			)}
		</div>
	);
}
