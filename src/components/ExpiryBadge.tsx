import { cn } from '@/lib/utils';

const DAY_MS = 86_400_000;

interface ExpiryBadgeProps {
  dateMs: number;
  now: number;
  expired?: boolean;
  showDate?: boolean;
}

export function ExpiryBadge({ dateMs, now, expired = false, showDate = false }: ExpiryBadgeProps) {
  const remaining = dateMs - now;
  const days = remaining / DAY_MS;
  const isExpired = expired || remaining <= 0;
  const label = isExpired
    ? remaining > -DAY_MS ? '已到期' : `已过期 ${Math.floor(-days)} 天`
    : remaining < DAY_MS ? '不足 1 天' : `剩余 ${Math.ceil(days)} 天`;
  const date = new Date(dateMs);

  return (
    <span title={`到期时间 ${date.toLocaleString('zh-CN')}`} className={cn(
      'inline-flex shrink-0 flex-wrap items-center gap-x-1 rounded-md px-2 py-1 text-xs tabular-nums',
      isExpired ? 'bg-muted text-muted-foreground' : days <= 7
        ? 'bg-destructive/10 text-destructive' : days <= 30
          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    )}>
      {showDate && <time dateTime={date.toISOString()}>到期 {date.toLocaleDateString('zh-CN')} ·</time>}
      <span>{label}</span>
    </span>
  );
}
