'use client';

import { CopyButton } from '@/components/CopyButton';
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
            <div className="bg-muted/50 p-2 rounded-md text-xs font-mono text-muted-foreground cursor-help select-all max-w-[300px] sm:max-w-[400px]">
                <div className="line-clamp-3 break-all">
                    {subscribeURL}
                </div>
            </div>
            <CopyButton text={subscribeURL} size="sm" variant="outline" className="h-8">
                复制
            </CopyButton>
        </div>
    );
}
