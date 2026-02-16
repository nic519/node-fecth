'use client';

import { CopyButton } from '@/components/CopyButton';
import { LinkIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SubscribeUrlPanelProps {
    uid: string;
    token: string;
}

export function SubscribeUrlPanel({ uid, token }: SubscribeUrlPanelProps) {
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOrigin(window.location.origin);
    }, []);

    const subscribeURL = origin ? `${origin}/api/x?uid=${uid}&token=${token}` : '';

    if (!origin) {
        return null; // 或者返回一个加载占位符
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200">
                <LinkIcon className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-sm text-gray-600 font-mono max-w-[300px] truncate hidden sm:inline-block">
                    {subscribeURL}
                </span>
            </div>
            <CopyButton text={subscribeURL} size="sm" variant="outline" className="h-8">
                复制链接
            </CopyButton>
        </div>
    );
}
