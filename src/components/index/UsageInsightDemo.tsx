'use client';

import { ChartLine } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

import { UsageCurveChart } from '@/components/UsageCurveChart';
import { cn } from '@/lib/utils';
import { formatTraffic } from '@/utils/trafficUtils';
import {
	estimateConsumptionRate,
	predictExhaustion,
	type PredictionConfidence,
	type UsageCurvePoint,
} from '@/utils/usageCurve';

const DAY_MS = 24 * 60 * 60 * 1000;
const GB = 1024 ** 3;

const CONFIDENCE_LABEL: Record<PredictionConfidence, string> = { high: '高', medium: '中', low: '低' };

interface MockSource {
	name: string;
	flag: string;
	totalBytes: number;
	expiresAtMs: number;
	points: UsageCurvePoint[];
}

interface MockSourceConfig {
	name: string;
	flag: string;
	/** 总额度（GB） */
	totalGb: number;
	/** 每日消耗（GB），长度即历史天数 */
	dailyUsageGb: number[];
	/** 距到期日的天数 */
	expiresInDays: number;
}

/**
 * 用「总额度 + 每日消耗 + 到期天数」生成一条确定性静态曲线。
 * 时间相对 now 展开（不写死日期），无论哪天打开页面看起来都是最近的数据；
 * 曲线形态固定，因此匀速参考、预计耗尽等结论也都是确定性的。
 */
function buildMockSource(config: MockSourceConfig, nowMs: number): MockSource {
	const totalBytes = Math.round(config.totalGb * GB);
	const startMs = nowMs - config.dailyUsageGb.length * DAY_MS;
	let remaining = totalBytes;
	const points: UsageCurvePoint[] = [{ t: startMs, remainingBytes: remaining, totalBytes }];
	config.dailyUsageGb.forEach((usageGb, index) => {
		remaining -= Math.round(usageGb * GB);
		points.push({ t: startMs + (index + 1) * DAY_MS, remainingBytes: remaining, totalBytes });
	});
	return {
		name: config.name,
		flag: config.flag,
		totalBytes,
		expiresAtMs: nowMs + config.expiresInDays * DAY_MS,
		points,
	};
}

function formatMonthDay(ms: number) {
	const date = new Date(ms);
	return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * 用量洞察演示：两条订阅源各自的真实 UsageCurveChart（实线剩余 vs 匀速参考虚线），
 * 日均消耗与预计耗尽时间由 usageCurve 纯函数从 mock 数据算出，不请求任何 API。
 */
export function UsageInsightDemo() {
	// 取整到小时：SSR 与客户端注水之间几乎不会跨过取整点，日期文案保持一致
	const [nowMs] = useState(() => new Date().setMinutes(0, 0, 0));
	const sources = useMemo(
		() => [
			// 主力源：消耗偏快，预计先于到期日用完（图表出现琥珀色「预计用完」标记）
			buildMockSource(
				{ name: '主力订阅源', flag: '🐙', totalGb: 200, dailyUsageGb: [6, 9, 8, 12, 10, 18, 14, 11, 8, 16, 14, 12], expiresInDays: 18 },
				nowMs,
			),
			// 备用源：消耗平缓，足以覆盖整个计费周期（图表只标出到期日）
			buildMockSource(
				{ name: '备用订阅源', flag: '🍚', totalGb: 100, dailyUsageGb: [1.2, 1.8, 1.5, 2.2, 1.6, 2, 1.4, 1.9, 1.3, 2.1, 1.7, 1.5], expiresInDays: 25 },
				nowMs,
			),
		],
		[nowMs],
	);

	// 底部结论同样由纯函数结果推导，与曲线标注保持一致
	const primary = sources[0];
	const primaryPrediction = predictExhaustion(primary.points, nowMs);
	const aheadDays =
		primaryPrediction !== null && primaryPrediction.atMs < primary.expiresAtMs
			? Math.max(1, Math.ceil((primary.expiresAtMs - primaryPrediction.atMs) / DAY_MS))
			: null;

	return (
		<div className="w-full overflow-hidden rounded-xl border border-border bg-card text-sm">
			<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-3 text-xs">
				<span className="flex items-center gap-2 font-medium"><ChartLine weight="fill" className="h-4 w-4 text-primary" />订阅源用量曲线</span>
				<span className="text-muted-foreground">实际剩余对比匀速参考 · 按最近消耗速率外推</span>
			</div>
			<div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2 lg:gap-5">
				{sources.map((source) => (
					<SourceUsageCard key={source.name} source={source} nowMs={nowMs} />
				))}
			</div>
			<div className="border-t border-border bg-muted/20 px-4 py-3 text-xs leading-5 text-muted-foreground">
				{aheadDays !== null ? (
					<>主力源预计提前 <span className="font-medium tabular-nums text-foreground">{aheadDays}</span> 天耗尽，续订与否可以提前决定；备用源足以覆盖整个周期，互为兜底。</>
				) : (
					'按当前消耗速度，两条订阅源都能撑到到期日。'
				)}
			</div>
		</div>
	);
}

function SourceUsageCard({ source, nowMs }: { source: MockSource; nowMs: number }) {
	const lastPoint = source.points[source.points.length - 1];
	const rate = estimateConsumptionRate(source.points, nowMs);
	const prediction = predictExhaustion(source.points, nowMs);
	const outBeforeExpiry = prediction !== null && prediction.atMs < source.expiresAtMs;
	const percent = Math.round((lastPoint.remainingBytes / source.totalBytes) * 100);
	const daysToExpiry = Math.max(1, Math.ceil((source.expiresAtMs - nowMs) / DAY_MS));

	return (
		<div className="rounded-xl border border-border/70 bg-background/60 p-4">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2.5">
					<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-sm">{source.flag}</span>
					<div>
						<div className="text-sm font-medium leading-4">{source.name}</div>
						<div className="mt-0.5 text-[11px] text-muted-foreground">近 {source.points.length - 1} 天 · {source.points.length} 次同步</div>
					</div>
				</div>
				<div className="text-right">
					<div className="text-sm font-semibold leading-4 tabular-nums">{percent}%</div>
					<div className="mt-0.5 text-[11px] text-muted-foreground">剩余 {formatTraffic(lastPoint.remainingBytes)}</div>
				</div>
			</div>
			<UsageCurveChart points={source.points} expiresAtMs={source.expiresAtMs} className="mt-3" />
			<div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-xs">
				<CardStat label="日均消耗" value={rate !== null ? formatTraffic(rate) : '—'} />
				<CardStat
					label="预计用完"
					value={prediction === null ? '—' : outBeforeExpiry ? formatMonthDay(prediction.atMs) : '晚于到期'}
					tone={prediction === null || !outBeforeExpiry ? 'muted' : 'warn'}
					sub={prediction !== null && outBeforeExpiry ? `置信度${CONFIDENCE_LABEL[prediction.confidence]}` : undefined}
				/>
				<CardStat label="到期日" value={formatMonthDay(source.expiresAtMs)} sub={`剩 ${daysToExpiry} 天`} />
			</div>
		</div>
	);
}

function CardStat({ label, value, sub, tone = 'default' }: { label: string; value: string; sub?: string; tone?: 'default' | 'warn' | 'muted' }) {
	return (
		<div className="min-w-0">
			<div className="text-[11px] text-muted-foreground">{label}</div>
			<div className={cn('mt-0.5 font-medium tabular-nums', tone === 'warn' && 'text-amber-600 dark:text-amber-500', tone === 'muted' && 'text-muted-foreground')}>{value}</div>
			{sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
		</div>
	);
}
