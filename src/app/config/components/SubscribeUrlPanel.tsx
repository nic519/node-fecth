'use client';

import { CopyButton } from '@/components/CopyButton';
import { Button } from '@/components/ui/button';
import { EyeIcon, LinkIcon } from 'lucide-react';
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
                    <LinkIcon className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm font-bold text-gray-900">订阅链接</span>
            </div>
            <div className="flex-1 min-w-0 w-full sm:w-auto">
                <div className="w-full bg-gray-50 text-gray-600 font-mono text-xs p-2 rounded-md truncate border border-gray-100">
                    {subscribeURL}
                </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0 justify-end sm:justify-start">
                <CopyButton text={subscribeURL} className="flex-1 sm:flex-none">
                    复制
                </CopyButton>
                {/* 预览按钮 */}
                <Button
                    onClick={handlePreviewSubscribeURL}
                    variant="default"
                    size="sm"
                    className="flex-1 sm:flex-none bg-blue-600 text-white hover:bg-blue-700 font-medium"
                >
                    <EyeIcon className="w-4 h-4 mr-2" />
                    预览
                </Button>
            </div>
        </div>
    );
}
