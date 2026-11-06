/**
 * 订阅流量使用曲线的纯计算逻辑。
 *
 * 曲线含义：Y 轴为剩余流量百分比（100% -> 0%），X 轴为时间。
 * 参考线为匀速下降直线（左上 100% 到右下 0%）：
 * - 起止时间已知（最早记录 + 到期时间）时按起止时间绘制；
 * - 到期时间未知时按最近消耗速度线性预测耗尽时间作为截止时间；
 * - 两者都不可知时退化为已有数据的时间范围。
 */

export interface UsageCurvePoint {
	/** 拉取时间（毫秒时间戳） */
	t: number;
	/** 剩余流量（字节） */
	remainingBytes: number;
	/** 总额度（字节） */
	totalBytes: number;
}

export interface UsageWindow {
	startMs: number;
	endMs: number;
	/** 按当前消耗速度预测的耗尽时间；无法合理预测时为 null */
	predictedAtMs: number | null;
}

interface UsageRecordLike {
	fetchedAtMs: number | null;
	remainingBytes: number | null;
	totalBytes: number | null;
}

/** 预测置信度：数据点越多、时间跨度越长越可信 */
export type PredictionConfidence = 'low' | 'medium' | 'high';

export interface ExhaustionPrediction {
	/** 预测剩余流量归零的时间（毫秒时间戳） */
	atMs: number;
	/** 当前周期的消耗速率（字节/天，正值） */
	rateBytesPerDay: number;
	confidence: PredictionConfidence;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** 预测最远不超过最后记录之后 2 年，且不超过数据跨度的 10 倍，避免噪声放大成离谱结论 */
const MAX_PREDICTION_MS = 2 * 365 * DAY_MS;
const MAX_PREDICTION_SPAN_RATIO = 10;

/**
 * 从历史记录中整理出可用于绘图的点：过滤缺字段的记录，按时间升序去重。
 */
export function buildUsagePoints(records: UsageRecordLike[]): UsageCurvePoint[] {
	const seen = new Set<number>();
	return records
		.filter((record): record is { fetchedAtMs: number; remainingBytes: number; totalBytes: number } =>
			record.fetchedAtMs !== null
			&& record.remainingBytes !== null
			&& record.totalBytes !== null
			&& record.totalBytes > 0)
		.sort((a, b) => a.fetchedAtMs - b.fetchedAtMs)
		.filter((record) => {
			if (seen.has(record.fetchedAtMs)) return false;
			seen.add(record.fetchedAtMs);
			return true;
		})
		.map((record) => ({ t: record.fetchedAtMs, remainingBytes: record.remainingBytes, totalBytes: record.totalBytes }));
}

/**
 * 各个计费周期的起点下标：剩余量回升或总额度变化视为一次重置（续费/换套餐），
 * 预测只应基于最近一次重置之后的数据。
 */
function cycleStartIndices(points: UsageCurvePoint[]): number[] {
	const starts = [0];
	for (let i = 1; i < points.length; i++) {
		const previous = points[i - 1];
		const current = points[i];
		if (current.remainingBytes > previous.remainingBytes || current.totalBytes !== previous.totalBytes) {
			starts.push(i);
		}
	}
	return starts;
}

function currentCycleStart(points: UsageCurvePoint[]): number {
	const starts = cycleStartIndices(points);
	return starts[starts.length - 1];
}

/**
 * Theil-Sen 估计：取所有点对斜率的中位数作为消耗速率（字节/天，正值）。
 * 相比最小二乘，单个突降/突升点最多影响与它相关的少量斜率，不会拉偏整体趋势。
 * 数据不足或没有在消耗（斜率 >= 0）时返回 null。
 */
function theilSenRateBytesPerDay(segment: UsageCurvePoint[]): number | null {
	if (segment.length < 2) return null;
	const slopes: number[] = [];
	for (let i = 0; i < segment.length; i++) {
		for (let j = i + 1; j < segment.length; j++) {
			const dtMs = segment[j].t - segment[i].t;
			if (dtMs <= 0) continue;
			slopes.push((segment[j].remainingBytes - segment[i].remainingBytes) / (dtMs / DAY_MS));
		}
	}
	if (slopes.length === 0) return null;
	slopes.sort((a, b) => a - b);
	const mid = slopes.length >> 1;
	const median = slopes.length % 2 === 1 ? slopes[mid] : (slopes[mid - 1] + slopes[mid]) / 2;
	if (median >= 0) return null; // 没有在消耗或消耗可忽略
	return -median;
}

/**
 * 基于当前周期（最近一次重置之后）的数据，用 Theil-Sen 估计消耗速率（字节/天）。
 * 点数 <2、没有在消耗时返回 null。点数有上限（采样后 ≤240），O(n²) 可接受。
 */
export function estimateConsumptionRate(points: UsageCurvePoint[], nowMs: number = Date.now()): number | null {
	const observed = points.filter((point) => point.t <= nowMs);
	return theilSenRateBytesPerDay(observed.slice(currentCycleStart(observed)));
}

/**
 * 预测剩余流量归零的时间：用当前周期的 Theil-Sen 速率从最后一个点外推。
 * 当前周期数据不足（<2 点）而上一周期有可靠速率时，用上一周期速率兜底，置信度记为 low。
 * 消耗过慢（预测超出合理上限）或数据不足时返回 null。
 */
export function predictExhaustion(points: UsageCurvePoint[], nowMs: number = Date.now()): ExhaustionPrediction | null {
	const observed = points.filter((point) => point.t <= nowMs);
	if (observed.length === 0) return null;

	const starts = cycleStartIndices(observed);
	const segment = observed.slice(starts[starts.length - 1]);
	const last = segment[segment.length - 1];

	let rate = theilSenRateBytesPerDay(segment);
	let rateSpanMs = segment.length >= 2 ? last.t - segment[0].t : 0;
	let usedPreviousCycle = false;

	// 多周期对照：当前周期还没积累出可估计的速率时，回退到上一周期的速率
	if (rate === null && segment.length < 2 && starts.length >= 2) {
		const previous = observed.slice(starts[starts.length - 2], starts[starts.length - 1]);
		const previousRate = theilSenRateBytesPerDay(previous);
		if (previousRate !== null) {
			rate = previousRate;
			rateSpanMs = previous[previous.length - 1].t - previous[0].t;
			usedPreviousCycle = true;
		}
	}
	if (rate === null) return null;

	const atMs = last.t + (last.remainingBytes / rate) * DAY_MS;
	if (atMs <= last.t) return null;
	if (atMs - nowMs > MAX_PREDICTION_MS) return null;
	if (rateSpanMs > 0 && atMs - last.t > rateSpanMs * MAX_PREDICTION_SPAN_RATIO) return null;

	let confidence: PredictionConfidence;
	if (usedPreviousCycle) {
		confidence = 'low';
	} else {
		const spanMs = last.t - segment[0].t;
		if (segment.length >= 7 && spanMs >= 3 * DAY_MS) confidence = 'high';
		else if (segment.length >= 3 && spanMs >= DAY_MS) confidence = 'medium';
		else confidence = 'low';
	}

	return { atMs, rateBytesPerDay: rate, confidence };
}

/**
 * 基于当前周期的数据预测剩余量归零的时间。
 * 保留原签名：内部委托 predictExhaustion，只取预测时间。
 */
export function predictExhaustionMs(points: UsageCurvePoint[], nowMs: number = Date.now()): number | null {
	return predictExhaustion(points, nowMs)?.atMs ?? null;
}

/**
 * 确定绘图时间窗口：
 * 1. 到期时间已知且晚于起点 -> 用它作为截止时间；
 * 2. 否则用预测耗尽时间；
 * 3. 都不可知时用已有数据的范围。
 */
export function resolveUsageWindow(
	points: UsageCurvePoint[],
	expiresAtMs: number | null,
	nowMs: number = Date.now(),
): UsageWindow | null {
	if (points.length === 0) return null;

	const startMs = points[0].t;
	const lastMs = points[points.length - 1].t;
	const predictedAtMs = predictExhaustionMs(points, nowMs);

	let endMs: number;
	if (expiresAtMs !== null && expiresAtMs > startMs) {
		endMs = expiresAtMs;
	} else if (predictedAtMs !== null) {
		endMs = predictedAtMs;
	} else {
		endMs = lastMs;
	}
	if (endMs <= startMs) endMs = startMs + 60 * 60 * 1000; // 单点/重叠数据兜底 1 小时窗口

	return { startMs, endMs, predictedAtMs };
}
