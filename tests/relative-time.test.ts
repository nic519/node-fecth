import { expect, test } from "bun:test";

import { formatRelativeTime, formatTimestampCN, parseTemplateTime } from "../src/utils/relativeTime";

// 以固定“当前时间”驱动相对时间断言，避免测试依赖真实时钟
const NOW = new Date("2026-11-06T12:00:00Z");

test("formatRelativeTime 分档输出 min/h/d", () => {
	expect(formatRelativeTime("2026-11-06T11:40:00Z", NOW)).toBe("20min");
	expect(formatRelativeTime("2026-11-06T07:00:00Z", NOW)).toBe("5h");
	expect(formatRelativeTime("2026-11-03T12:00:00Z", NOW)).toBe("3d");
});

test("formatRelativeTime 一分钟内显示“刚刚”，未来时间同样兜底", () => {
	expect(formatRelativeTime("2026-11-06T11:59:30Z", NOW)).toBe("刚刚");
	expect(formatRelativeTime("2026-11-06T12:00:01Z", NOW)).toBe("刚刚");
});

test("formatRelativeTime 按 UTC 解析 SQLite datetime('now') 默认值", () => {
	// "2026-11-06 11:40:00" 是 UTC，距 NOW 20 分钟；若误按本地时区解析会得到错误分档
	expect(formatRelativeTime("2026-11-06 11:40:00", NOW)).toBe("20min");
	expect(formatRelativeTime("2026-11-06 11:59:30", NOW)).toBe("刚刚");
});

test("formatRelativeTime 对空值与无法解析的输入返回“-”", () => {
	expect(formatRelativeTime(null, NOW)).toBe("-");
	expect(formatRelativeTime("", NOW)).toBe("-");
	expect(formatRelativeTime("not-a-time", NOW)).toBe("-");
});

test("parseTemplateTime 同时接受带秒与省略秒的 SQLite 形态", () => {
	expect(parseTemplateTime("2026-11-06 11:40:00")).toBe(Date.parse("2026-11-06T11:40:00Z"));
	expect(parseTemplateTime("2026-11-06 11:40")).toBe(Date.parse("2026-11-06T11:40:00Z"));
	expect(parseTemplateTime("2026-11-06T11:40:00Z")).toBe(Date.parse("2026-11-06T11:40:00Z"));
	expect(parseTemplateTime("bad")).toBeNull();
});

test("formatTimestampCN 统一输出北京时间 YYYY-MM-DD HH:mm", () => {
	// UTC 00:09 对应北京时间 08:09
	expect(formatTimestampCN("2026-10-01T00:09:00Z")).toBe("2026-10-01 08:09");
	// SQLite UTC 默认值与 ISO 形态指向同一时刻，输出一致
	expect(formatTimestampCN("2026-10-01 00:09:00")).toBe("2026-10-01 08:09");
});

test("formatTimestampCN 空值返回“-”，无法解析时原样返回", () => {
	expect(formatTimestampCN(null)).toBe("-");
	expect(formatTimestampCN("legacy-but-unparseable")).toBe("legacy-but-unparseable");
});

test("formatRelativeTime 跨级边界取整正确", () => {
	// 59 分钟仍是 min，60 分钟进位为 1h；23h 进位前一天为 1d
	expect(formatRelativeTime("2026-11-06T11:01:00Z", NOW)).toBe("59min");
	expect(formatRelativeTime("2026-11-06T11:00:00Z", NOW)).toBe("1h");
	expect(formatRelativeTime("2026-11-05T13:00:00Z", NOW)).toBe("23h");
	expect(formatRelativeTime("2026-11-05T12:00:00Z", NOW)).toBe("1d");
});
