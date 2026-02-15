'use client';

import { CopyButton } from '@/components/CopyButton';
import { Button, Snippet } from '@heroui/react';
import { useEffect, useState } from 'react';

interface SubscribeUrlPanelProps {
	uid: string;
	token: string;
}

export function SubscribeUrlPanel({ uid, token }: SubscribeUrlPanelProps) {
	const [origin, setOrigin] = useState('');

	useEffect(() => {
		setOrigin(window.location.origin);
	}, []);

	const subscribeURL = origin ? `${origin}/api/x?uid=${uid}&token=${token}` : '';

	const handlePreviewSubscribeURL = async () => {
		if (subscribeURL) {
			window.open(subscribeURL + '&download=false', '_blank');
		}
	};

	if (!origin) {
		return null; // 或者返回一个加载占位符
	}

	return (
		<div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
			<div className="flex items-center space-x-2 flex-shrink-0">
				<div className="p-2 bg-blue-50 rounded-lg">
                    <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                        />
                    </svg>
                </div>
				<span className="text-sm font-bold text-gray-900">订阅链接</span>
			</div>
			<div className="flex-1 min-w-0 w-full sm:w-auto">
				<Snippet 
                    symbol="" 
                    variant="flat" 
                    hideSymbol 
                    className="w-full bg-gray-50 text-gray-600 font-mono text-xs"
                    classNames={{
                        pre: "truncate",
                    }}
                >
					{subscribeURL}
				</Snippet>
			</div>
            <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                <CopyButton text={subscribeURL} className="flex-1 sm:flex-none">
                    复制
                </CopyButton>
                {/* 预览按钮 */}
                <Button 
                    onPress={handlePreviewSubscribeURL} 
                    color="primary" 
                    variant="flat" 
                    size="sm" 
                    className="flex-1 sm:flex-none bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium"
                    startContent={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                    }
                >
                    预览
                </Button>
            </div>
		</div>
	);
}
