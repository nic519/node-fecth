import { Button } from '@/components/ui/button';
import { Sparkles, ArrowUpRight } from 'lucide-react';

interface PromoLinkButtonProps {
    promoUrl: string;
}

export function PromoLinkButton({ promoUrl }: PromoLinkButtonProps) {
    return (
        <Button
            size="sm"
            asChild
            className="h-10 px-3 text-xs font-medium text-white bg-gradient-to-r from-orange-700 to-amber-600 hover:from-amber-800 hover: border-orange-600/20 transition-all hover:scale-105 active:scale-95 duration-300"
        >
            <a href={promoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 transition-transform duration-300 motion-safe:hover:-translate-y-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="flex flex-col items-start leading-tight">
                    <span>订阅推广注册</span>
                    <span className="text-[10px] text-white/85 font-normal">性价比高，延迟极低</span>
                </span>
                <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
        </Button>
    );
}
