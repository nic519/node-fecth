import { cn } from '@/lib/utils';
import { formatTraffic, getTrafficBarColor } from '@/utils/trafficUtils';

interface UsageColumnBarProps {
	/** 剩余流量（字节） */
	remainingBytes: number;
	/** 总额度（字节） */
	totalBytes: number;
	/** 柱体高度（px），默认与曲线图高度对齐 */
	height?: number;
	className?: string;
}

/**
 * 竖向流量柱：从底部向上填充表示剩余比例，替代横向进度条。
 * 与流量使用曲线图左右并列使用。
 */
export function UsageColumnBar({ remainingBytes, totalBytes, height = 120, className }: UsageColumnBarProps) {
	const remainingPercent = totalBytes > 0 ? Math.min(100, Math.max(0, (remainingBytes / totalBytes) * 100)) : 0;
	const usedPercent = 100 - remainingPercent;

	return (
		<div
			className={cn('flex w-14 shrink-0 flex-col items-center gap-1.5', className)}
			title={`剩余 ${formatTraffic(remainingBytes)} / ${formatTraffic(totalBytes)}（${remainingPercent.toFixed(1)}%）`}
		>
			<span className={cn(
				'text-[11px] font-medium tabular-nums',
				usedPercent > 90 ? 'text-red-500' : usedPercent > 70 ? 'text-yellow-600 dark:text-yellow-500' : 'text-muted-foreground',
			)}>
				{remainingPercent.toFixed(0)}%
			</span>
			<div
				role="img"
				aria-label={`剩余流量 ${remainingPercent.toFixed(1)}%`}
				className="relative w-6 flex-1 overflow-hidden rounded-full bg-secondary"
				style={{ minHeight: height - 52 }}
			>
				<div
					className={cn('absolute inset-x-0 bottom-0 rounded-full transition-all duration-700 ease-out', getTrafficBarColor(usedPercent))}
					style={{ height: `${remainingPercent}%` }}
				/>
			</div>
			<span className="text-[10px] text-muted-foreground">剩余</span>
			<span className="max-w-full truncate text-[10px] tabular-nums text-muted-foreground">
				{formatTraffic(remainingBytes)}
			</span>
		</div>
	);
}
