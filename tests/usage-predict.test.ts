import { expect, test } from "bun:test";

import {
	estimateConsumptionRate,
	predictExhaustion,
	predictExhaustionMs,
	type UsageCurvePoint,
} from "../src/utils/usageCurve";

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse("2026-10-01T00:00:00Z");

function point(days: number, remainingBytes: number, totalBytes = 1000): UsageCurvePoint {
	return { t: T0 + days * DAY, remainingBytes, totalBytes };
}

/** 匀速消耗序列：每天消耗 ratePerDay，共 count 个点 */
function linearPoints(count: number, ratePerDay: number, startRemaining = 1000): UsageCurvePoint[] {
	return Array.from({ length: count }, (_, i) => point(i, startRemaining - ratePerDay * i));
}

test("estimateConsumptionRate recovers a linear consumption rate", () => {
	const points = linearPoints(8, 10);
	expect(estimateConsumptionRate(points, T0 + 7 * DAY)).toBe(10);
});

test("estimateConsumptionRate returns null without enough points or consumption", () => {
	expect(estimateConsumptionRate([], T0)).toBeNull();
	expect(estimateConsumptionRate([point(0, 100)], T0)).toBeNull();
	// 没有消耗
	expect(estimateConsumptionRate([point(0, 100), point(5, 100)], T0 + 5 * DAY)).toBeNull();
});

test("estimateConsumptionRate only uses the segment after the last refill", () => {
	const points = [
		point(0, 1000), point(10, 500), // 上一周期每天 50
		point(11, 2000), point(13, 1980), // 充值后每天 10
	];
	expect(estimateConsumptionRate(points, T0 + 13 * DAY)).toBe(10);
});

test("predictExhaustion extrapolates from the last point with the Theil-Sen rate", () => {
	const points = linearPoints(8, 50); // 第 7 天剩 650
	const prediction = predictExhaustion(points, T0 + 7 * DAY);
	expect(prediction).not.toBeNull();
	expect(prediction!.rateBytesPerDay).toBe(50);
	expect(prediction!.atMs).toBe(T0 + 7 * DAY + 13 * DAY);
});

test("predictExhaustion is robust to a sudden one-day burst", () => {
	// 线性趋势每天 50，第 5 天有一次集中下载多消耗 400
	const points = linearPoints(10, 50);
	points[5] = point(5, 1000 - 250 - 400);
	const prediction = predictExhaustion(points, T0 + 9 * DAY);
	expect(prediction).not.toBeNull();
	// Theil-Sen：与突降点无关的点对斜率仍占多数，速率应保持在 50 附近
	expect(prediction!.rateBytesPerDay).toBe(50);
	// 从最后一个点（第 9 天剩 550）外推，约 11 天后耗尽
	const expected = T0 + 9 * DAY + 11 * DAY;
	expect(Math.abs(prediction!.atMs - expected)).toBeLessThanOrEqual(2 * DAY);
});

test("predictExhaustion grades confidence by point count and span", () => {
	// high：>=7 个点且跨度 >=3 天
	expect(predictExhaustion(linearPoints(7, 50), T0 + 6 * DAY)!.confidence).toBe("high");
	// medium：>=3 个点且跨度 >=1 天
	expect(predictExhaustion(linearPoints(3, 50), T0 + 2 * DAY)!.confidence).toBe("medium");
	// medium 边界：3 个点但跨度不足 1 天
	const tightSpan = [point(0, 1000), point(0.4, 996), point(0.8, 992)];
	expect(predictExhaustion(tightSpan, T0 + 0.8 * DAY)).toBeNull(); // 速率太慢触发上限
	// low：只有 2 个点
	expect(predictExhaustion([point(0, 1000), point(1, 900)], T0 + DAY)!.confidence).toBe("low");
});

test("predictExhaustion falls back to the previous cycle rate with low confidence", () => {
	// 上一周期：10 天每天 50；重置后当前周期只有 1 个点
	const points = [
		...linearPoints(11, 50),
		point(11, 2000),
	];
	const prediction = predictExhaustion(points, T0 + 11 * DAY);
	expect(prediction).not.toBeNull();
	expect(prediction!.rateBytesPerDay).toBe(50);
	expect(prediction!.confidence).toBe("low");
	expect(prediction!.atMs).toBe(T0 + 11 * DAY + (2000 / 50) * DAY);
});

test("predictExhaustion returns null when consumption is implausibly slow", () => {
	// 每天 0.01：预测远超数据跨度 10 倍与 2 年上限
	const points = [point(0, 1000), point(10, 999.9)];
	expect(predictExhaustion(points, T0 + 10 * DAY)).toBeNull();
});

test("predictExhaustion returns null when there is no consumption", () => {
	const points = [point(0, 1000), point(10, 1000)];
	expect(predictExhaustion(points, T0 + 10 * DAY)).toBeNull();
});

test("predictExhaustionMs stays compatible with predictExhaustion", () => {
	const points = linearPoints(8, 50);
	const now = T0 + 7 * DAY;
	expect(predictExhaustionMs(points, now)).toBe(predictExhaustion(points, now)!.atMs);
	expect(predictExhaustionMs([point(0, 1000), point(10, 1000)], T0 + 10 * DAY)).toBeNull();
	expect(predictExhaustionMs([], T0)).toBeNull();
});
