import { expect, test } from "bun:test";

import { buildHeartbeatBins } from "../src/utils/heartbeatBins";

const HOUR = 60 * 60 * 1000;
// 用本地时间构造锚点，避免测试机时区影响自然日对齐的断言
const endMs = new Date(2026, 10, 6, 15, 30).getTime(); // 2026-11-06 15:30 本地

function at(daysAgo: number, hour = 0) {
	return new Date(2026, 10, 6 - daysAgo, hour).getTime();
}

test("buildHeartbeatBins (1 天) 等分为 24 个小时桶并按落点计数", () => {
	const { granularity, starts, counts } = buildHeartbeatBins(
		[new Date(endMs - 30 * 60_000).toISOString(), new Date(endMs - 30 * 60_000).toISOString(), new Date(endMs - 12 * HOUR).toISOString()],
		endMs,
		1,
	);
	expect(granularity).toBe("hour");
	expect(starts).toHaveLength(24);
	expect(counts).toHaveLength(24);
	expect(counts.reduce((sum, count) => sum + count, 0)).toBe(3);
	// 结束前 30 分钟落在最后一桶（第 23 桶），12 小时前正好落在窗口中点（第 12 桶）
	expect(counts[23]).toBe(2);
	expect(counts[12]).toBe(1);
	expect(Date.parse(starts[0])).toBe(endMs - 24 * HOUR);
});

test("buildHeartbeatBins (1 天) 忽略非法时间戳并把越界记录并入边缘桶", () => {
	const { counts } = buildHeartbeatBins(
		["not-a-date", new Date(endMs - 48 * HOUR).toISOString(), new Date(endMs + HOUR).toISOString()],
		endMs,
		1,
	);
	expect(counts.reduce((sum, count) => sum + count, 0)).toBe(2);
	expect(counts[0]).toBe(1); // 窗口之前的记录并入第一桶
	expect(counts[23]).toBe(1); // 窗口之后的记录并入最后一桶
});

test("buildHeartbeatBins (14 天) 按本地自然日对齐为 14 个天桶", () => {
	const { granularity, starts, counts } = buildHeartbeatBins(
		[
			new Date(at(0, 9)).toISOString(), // 当天上午 -> 最后一桶
			new Date(at(5, 8)).toISOString(), // 5 天前 -> 第 8 桶
			new Date(at(5, 23)).toISOString(), // 同一天晚些 -> 第 8 桶
			new Date(at(13, 12)).toISOString(), // 第一桶当天
		],
		endMs,
		14,
	);
	expect(granularity).toBe("day");
	expect(starts).toHaveLength(14);
	expect(counts).toHaveLength(14);
	expect(counts.reduce((sum, count) => sum + count, 0)).toBe(4);
	expect(counts[13]).toBe(1);
	expect(counts[8]).toBe(2);
	expect(counts[0]).toBe(1);
	// 每桶起点为本地当天零点：第一桶 = 2026-10-24，最后一桶 = 2026-11-06
	expect(new Date(starts[13])).toEqual(new Date(2026, 10, 6));
	expect(new Date(starts[0])).toEqual(new Date(2026, 9, 24));
});

test("buildHeartbeatBins (14 天) 把窗口外与非法记录排除在计数外或并入第一桶", () => {
	const { counts } = buildHeartbeatBins(
		["", new Date(at(20)).toISOString(), new Date(at(14) - 1).toISOString()],
		endMs,
		14,
	);
	// 非法时间戳被忽略；窗口之前的记录并入第一桶
	expect(counts.reduce((sum, count) => sum + count, 0)).toBe(2);
	expect(counts[0]).toBe(2);
});
