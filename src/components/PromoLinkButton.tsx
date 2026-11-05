import { Button } from '@/components/ui/button';
import { ArrowSquareOut, Sparkle } from '@phosphor-icons/react';

interface PromoLinkButtonProps {
    promoUrl: string;
}

export function PromoLinkButton({ promoUrl }: PromoLinkButtonProps) {
    return (
        <Button
            size="sm"
            variant="outline"
            asChild
            className="h-10 px-3 text-xs font-medium"
        >
            <a href={promoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 transition-transform duration-300 motion-safe:hover:-translate-y-0.5">
                <Sparkle className="h-4 w-4 text-muted-foreground" />
                <span>订阅推广注册</span>
                <ArrowSquareOut className="h-4 w-4 text-muted-foreground" />
            </a>
        </Button>
    );
}
