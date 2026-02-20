'use client';

import { useEffect, useState } from 'react';
import { Link2, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/utils/configUtils';

interface SubscribeUrlPanelProps {
    uid: string;
    token: string;
}

export function SubscribeUrlPanel({ uid, token }: SubscribeUrlPanelProps) {
    const [origin, setOrigin] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOrigin(window.location.origin);
    }, []);

    const subscribeURL = origin ? `${origin}/api/x?uid=${uid}&token=${token}` : '';

    const handleCopy = async () => {
        if (!subscribeURL) return;
        const success = await copyToClipboard(subscribeURL);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!origin) {
        return null;
    }

    return (
        <button
            onClick={handleCopy}
            className="group flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-all duration-200 px-1 py-1 rounded-lg hover:bg-muted/50 cursor-pointer"
            title="点击复制订阅链接"
        >
            <div className="flex items-center gap-2 min-w-0 flex-1">
                <Link2 className="h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity text-primary" />
                <span className="truncate font-mono opacity-70 group-hover:opacity-100 transition-opacity">
                    {subscribeURL.replace(origin, '')}
                </span>
            </div>
            <div className="shrink-0 ml-2">
                {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                    <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                )}
            </div>
        </button>
    );
}
