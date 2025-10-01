import { CopyButton } from '@/components/CopyButton';
import { Button, Snippet } from '@heroui/react';

interface SubscribeUrlPanelProps {
	uid: string;
	token: string;
}

export function SubscribeUrlPanel({ uid, token }: SubscribeUrlPanelProps) {
	const subscribeURL = `${window.location.origin}/api/x?uid=${uid}&token=${token}`;

	const handlePreviewSubscribeURL = async () => {
		window.open(subscribeURL + '&download=false', '_blank');
	};

	return (
		<div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
			<div className="flex items-center space-x-2 flex-shrink-0">
				<svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
					/>
				</svg>
				<span className="text-sm font-medium text-gray-700">固定链接：</span>
			</div>
			<div className="flex-1 min-w-0 w-full sm:w-auto">
				<Snippet symbol="" variant="bordered" hideSymbol className="w-full">
					{subscribeURL}
				</Snippet>
			</div>
			<CopyButton text={subscribeURL} className="w-full sm:w-auto flex-shrink-0">
				复制订阅
			</CopyButton>
			{/* 预览按钮 */}
			<Button onClick={handlePreviewSubscribeURL} color="secondary" variant="solid" size="sm" className="w-full sm:w-auto flex-shrink-0">
				预览
			</Button>
		</div>
	);
}
