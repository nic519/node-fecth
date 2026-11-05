'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, LinkSimple } from '@phosphor-icons/react';
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
            className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            title="点击复制订阅链接"
        >
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <LinkSimple className="h-4 w-4 shrink-0 text-primary" />
                <span className="line-clamp-2 break-all font-mono">{subscribeURL}</span>
            </div>
            <div className="shrink-0" aria-live="polite">
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 opacity-60 group-hover:opacity-100" />}
            </div>
        </button>
    );
}
