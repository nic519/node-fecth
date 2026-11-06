'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useUsageSeries } from '@/hooks/useUsageSeries';
import { cn } from '@/lib/utils';
import { formatTraffic } from '@/utils/trafficUtils';
import { estimateConsumptionRate, resolveUsageWindow, type UsageCurvePoint } from '@/utils/usageCurve';

const PAD_LEFT = 34;
const PAD_RIGHT = 14;
const PAD_TOP = 10;
const PAD_BOTTOM = 22;

/** 曲线绘制高度（px）：列表内嵌用矮版，详情场景用高版；信息区与图例行不计入 */
const CHART_HEIGHT_COMPACT = 104;
const CHART_HEIGHT_FULL = 132;

function formatAxisDate(ms: number, withTime: boolean) {
	const date = new Date(ms);
	const day = `${date.getMonth() + 1}/${date.getDate()}`;
	if (!withTime) return day;
	return `${day} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDate(ms: number) {
	const date = new Date(ms);
	return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

interface UsageCurveChartProps {
	points: UsageCurvePoint[];
	expiresAtMs: number | null;
	/** 紧凑模式：更矮、无数据时不占位（用于列表内嵌） */
	compact?: boolean;
	className?: string;
}

/**
 * 流量使用曲线：实际剩余流量（实线）对比匀速消耗参考线（左上 100% 到右下 0% 的虚线）。
 * 截止时间优先取到期时间，缺失时按最近消耗速度预测耗尽时间。
 */
export function UsageCurveChart({ points, expiresAtMs, compact = false, className }: UsageCurveChartProps) {
	const gradientId = useId();
	const containerRef = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState(0);
	const [nowMs] = useState(() => Date.now());

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		// ResizeObserver 在某些环境（页面冻结、iframe 懒激活）不会触发，先用 clientWidth 兜底
		setWidth(Math.round(container.getBoundingClientRect().width));
		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry) setWidth(Math.round(entry.contentRect.width));
		});
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	const height = compact ? CHART_HEIGHT_COMPACT : CHART_HEIGHT_FULL;
	const window_ = resolveUsageWindow(points, expiresAtMs, nowMs);

	if (!window_) {
		if (compact) return null;
		return (
			<div className={cn('flex items-center justify-center rounded-lg bg-secondary/40 text-xs text-muted-foreground', className)} style={{ height }}>
				暂无流量历史，同步几次后生成使用曲线
			</div>
		);
	}

	const { startMs, endMs, predictedAtMs } = window_;
	const spanMs = endMs - startMs;
	const withTime = spanMs < 2 * 24 * 60 * 60 * 1000;
	const showPrediction = predictedAtMs !== null && predictedAtMs < endMs && predictedAtMs > nowMs;
	const expired = expiresAtMs !== null && expiresAtMs <= nowMs;

	const statusText = expired && expiresAtMs !== null
		? `已于 ${formatDate(expiresAtMs)} 到期`
		: showPrediction
			? `按当前速度预计 ${formatDate(predictedAtMs)} 用完${expiresAtMs !== null ? `（到期 ${formatDate(expiresAtMs)}）` : ''}`
			: expiresAtMs !== null
				? `到期 ${formatDate(expiresAtMs)}`
				: '消耗平缓，暂无法预测耗尽时间';

	// 能从当前周期估出消耗速率时，在状态区追加日均消耗，帮助判断是否需要续订
	const dailyRate = estimateConsumptionRate(points, nowMs);
	const statusWithRate = dailyRate !== null ? `${statusText} · 日均消耗 ${formatTraffic(dailyRate)}` : statusText;

	return (
		<div className={cn('min-w-0', className)}>
			{/* 图例与预测说明合并且严格单行：超长截断、悬停见全文，同时保证多卡片图表顶部对齐 */}
			<div className="mb-1 flex h-4 items-center gap-x-4 text-[11px] leading-4 text-muted-foreground">
				<span className="flex shrink-0 items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary" />实际剩余</span>
				<span className="flex shrink-0 items-center gap-1.5"><span className="h-px w-3 border-t border-dashed border-muted-foreground" />匀速参考</span>
				<span className={cn('ml-auto min-w-0 truncate tabular-nums', showPrediction && 'text-amber-600 dark:text-amber-500')} title={statusWithRate}>{statusWithRate}</span>
			</div>
			<div ref={containerRef} className="w-full">
				{width > 0 ? (
					<ChartBody
						points={points}
						startMs={startMs}
						endMs={endMs}
						nowMs={nowMs}
						predictedAtMs={showPrediction ? predictedAtMs : null}
						width={width}
						height={height}
						withTime={withTime}
						gradientId={gradientId}
					/>
				) : (
					<div style={{ height }} aria-hidden />
				)}
			</div>
		</div>
	);
}

interface ChartBodyProps {
	points: UsageCurvePoint[];
	startMs: number;
	endMs: number;
	nowMs: number;
	predictedAtMs: number | null;
	width: number;
	height: number;
	withTime: boolean;
	gradientId: string;
}

function ChartBody({ points, startMs, endMs, nowMs, predictedAtMs, width, height, withTime, gradientId }: ChartBodyProps) {
	const innerWidth = Math.max(1, width - PAD_LEFT - PAD_RIGHT);
	const innerHeight = height - PAD_TOP - PAD_BOTTOM;
	const spanMs = Math.max(1, endMs - startMs);

	const xOf = (t: number) => PAD_LEFT + Math.min(1, Math.max(0, (t - startMs) / spanMs)) * innerWidth;
	const yOf = (percent: number) => PAD_TOP + innerHeight - (Math.min(100, Math.max(0, percent)) / 100) * innerHeight;

	const percents = points.map((point) => (point.remainingBytes / point.totalBytes) * 100);
	const linePath = percents
		.map((percent, index) => `${index === 0 ? 'M' : 'L'}${xOf(points[index].t).toFixed(2)},${yOf(percent).toFixed(2)}`)
		.join(' ');
	const areaPath = points.length > 1
		? `${linePath} L${xOf(points[points.length - 1].t).toFixed(2)},${(PAD_TOP + innerHeight).toFixed(2)} L${xOf(points[0].t).toFixed(2)},${(PAD_TOP + innerHeight).toFixed(2)} Z`
		: null;

	const showNow = nowMs > startMs && nowMs < endMs;

	return (
		<svg width={width} height={height} role="img" aria-label="流量使用曲线图" className="block">
			<defs>
				<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="currentColor" className="text-primary" stopOpacity="0.22" />
					<stop offset="100%" stopColor="currentColor" className="text-primary" stopOpacity="0.02" />
				</linearGradient>
			</defs>

			{[100, 50, 0].map((percent) => (
				<g key={percent}>
					<line x1={PAD_LEFT} x2={width - PAD_RIGHT} y1={yOf(percent)} y2={yOf(percent)} className="stroke-border" strokeDasharray="3 5" strokeWidth="1" />
					<text x={PAD_LEFT - 6} y={yOf(percent) + 3.5} textAnchor="end" className="fill-muted-foreground stroke-background" fontSize="10" paintOrder="stroke" strokeWidth="3">{percent}%</text>
				</g>
			))}

			{/* 起止日期标签：窗口太窄时只保留一个居中标签，避免互相遮挡 */}
			{xOf(endMs) - xOf(startMs) >= 70 ? (
				<>
					<text x={xOf(startMs)} y={height - 6} textAnchor="start" className="fill-muted-foreground stroke-background" fontSize="10" paintOrder="stroke" strokeWidth="3">{formatAxisDate(startMs, withTime)}</text>
					<text x={xOf(endMs)} y={height - 6} textAnchor="end" className="fill-muted-foreground stroke-background" fontSize="10" paintOrder="stroke" strokeWidth="3">{formatAxisDate(endMs, withTime)}</text>
				</>
			) : (
				<text x={(xOf(startMs) + xOf(endMs)) / 2} y={height - 6} textAnchor="middle" className="fill-muted-foreground stroke-background" fontSize="10" paintOrder="stroke" strokeWidth="3">
					{`${formatAxisDate(startMs, withTime)} – ${formatAxisDate(endMs, withTime)}`}
				</text>
			)}

			{/* 匀速消耗参考线：左上 100% 到右下 0% */}
			<line
				x1={xOf(startMs)} y1={yOf(100)} x2={xOf(endMs)} y2={yOf(0)}
				className="stroke-muted-foreground/60" strokeWidth="1.5" strokeDasharray="5 4"
			/>

			{showNow && (
				<g>
					<line x1={xOf(nowMs)} x2={xOf(nowMs)} y1={PAD_TOP} y2={PAD_TOP + innerHeight} className="stroke-foreground/30" strokeWidth="1" strokeDasharray="2 3" />
					<text
						x={xOf(nowMs)} y={PAD_TOP + innerHeight - 5}
						textAnchor={xOf(nowMs) > width - 40 ? 'end' : xOf(nowMs) < PAD_LEFT + 30 ? 'start' : 'middle'}
						className="fill-muted-foreground stroke-background" fontSize="9" paintOrder="stroke" strokeWidth="3"
					>现在</text>
				</g>
			)}

			{predictedAtMs !== null && (
				<g>
					<line x1={xOf(predictedAtMs)} x2={xOf(predictedAtMs)} y1={PAD_TOP} y2={PAD_TOP + innerHeight} className="stroke-amber-500/70" strokeWidth="1.5" strokeDasharray="4 3" />
					<text
						x={xOf(predictedAtMs)} y={PAD_TOP + 9}
						textAnchor={xOf(predictedAtMs) > width - 50 ? 'end' : xOf(predictedAtMs) < PAD_LEFT + 40 ? 'start' : 'middle'}
						className="fill-amber-600 stroke-background dark:fill-amber-500" fontSize="9" paintOrder="stroke" strokeWidth="3"
					>预计用完</text>
				</g>
			)}

			{areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
			{points.length > 1 && (
				<path d={linePath} fill="none" className="stroke-primary" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
			)}
			{points.map((point, index) => (
				<circle key={`${point.t}-${index}`} cx={xOf(point.t)} cy={yOf(percents[index])} r="2.5" className="fill-primary">
					<title>{`${formatAxisDate(point.t, true)} · 剩余 ${formatTraffic(point.remainingBytes)} / ${formatTraffic(point.totalBytes)}（${percents[index].toFixed(1)}%）`}</title>
				</circle>
			))}
		</svg>
	);
}

interface SourceUsageChartProps {
	url: string;
	compact?: boolean;
	className?: string;
}

/**
 * 按订阅源 URL 自动拉取历史并渲染流量使用曲线。
 */
export function SourceUsageChart({ url, compact = false, className }: SourceUsageChartProps) {
	const { series, loading, error } = useUsageSeries(url);

	if (loading && !series) {
		return <Skeleton className={cn('w-full rounded-lg', className)} style={{ height: compact ? CHART_HEIGHT_COMPACT : CHART_HEIGHT_FULL }} aria-label="正在加载流量使用曲线" />;
	}
	if (error || !series) {
		if (compact) return null;
		return (
			<div className={cn('flex items-center justify-center rounded-lg bg-secondary/40 text-xs text-muted-foreground', className)} style={{ height: compact ? CHART_HEIGHT_COMPACT : CHART_HEIGHT_FULL }}>
				使用曲线加载失败
			</div>
		);
	}
	return <UsageCurveChart points={series.points} expiresAtMs={series.expiresAtMs} compact={compact} className={className} />;
}
