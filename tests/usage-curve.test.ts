import { createClient } from "@libsql/client";
import { afterAll, beforeAll, expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/libsql";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import * as schema from "../src/db/schema";
import { DynamicService } from "../src/modules/dynamic/dynamic.service";
import { hashUrl } from "../src/utils/hashUtils";
import { buildUsagePoints, predictExhaustionMs, resolveUsageWindow, type UsageCurvePoint } from "../src/utils/usageCurve";

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse("2026-10-01T00:00:00Z");

function point(days: number, remainingBytes: number, totalBytes = 100): UsageCurvePoint {
	return { t: T0 + days * DAY, remainingBytes, totalBytes };
}

test("buildUsagePoints filters invalid records, sorts ascending and dedupes", () => {
	const points = buildUsagePoints([
		{ fetchedAtMs: T0 + DAY, remainingBytes: 50, totalBytes: 100 },
		{ fetchedAtMs: null, remainingBytes: 60, totalBytes: 100 },
		{ fetchedAtMs: T0, remainingBytes: null, totalBytes: 100 },
		{ fetchedAtMs: T0, remainingBytes: 80, totalBytes: 0 },
		{ fetchedAtMs: T0 + DAY, remainingBytes: 50, totalBytes: 100 },
	]);
	expect(points).toEqual([{ t: T0 + DAY, remainingBytes: 50, totalBytes: 100 }]);
});

test("resolveUsageWindow uses the expiry time as the end when it is known", () => {
	const points = [point(0, 100), point(10, 50)];
	const expiresAtMs = T0 + 30 * DAY;
	const window = resolveUsageWindow(points, expiresAtMs, T0 + 10 * DAY);
	expect(window).not.toBeNull();
	expect(window!.startMs).toBe(T0);
	expect(window!.endMs).toBe(expiresAtMs);
	// 到期之前就会耗尽：10 天用掉一半，预测第 20 天用完
	expect(window!.predictedAtMs).toBe(T0 + 20 * DAY);
});

test("resolveUsageWindow falls back to prediction when expiry is unknown", () => {
	const points = [point(0, 100), point(10, 50)];
	const window = resolveUsageWindow(points, null, T0 + 10 * DAY);
	expect(window!.endMs).toBe(T0 + 20 * DAY);
	expect(window!.predictedAtMs).toBe(T0 + 20 * DAY);
});

test("resolveUsageWindow falls back to the data range when nothing can be predicted", () => {
	// 没有消耗：斜率为 0，无法预测
	const points = [point(0, 100), point(10, 100)];
	const window = resolveUsageWindow(points, null, T0 + 10 * DAY);
	expect(window!.endMs).toBe(T0 + 10 * DAY);
	expect(window!.predictedAtMs).toBeNull();
});

test("predictExhaustionMs only considers the segment after the last refill", () => {
	const points = [point(0, 100), point(10, 50), point(11, 200), point(21, 100)];
	// 重置后：11 天 200 -> 21 天 100，每天 10，再 10 天耗尽
	expect(predictExhaustionMs(points, T0 + 21 * DAY)).toBe(T0 + 31 * DAY);
});

test("predictExhaustionMs rejects implausibly slow consumption", () => {
	const points = [point(0, 100), point(10, 99.9)];
	expect(predictExhaustionMs(points, T0 + 10 * DAY)).toBeNull();
});

test("resolveUsageWindow pads a single point to a one-hour window", () => {
	const window = resolveUsageWindow([point(0, 100)], null, T0);
	expect(window!.startMs).toBe(T0);
	expect(window!.endMs).toBe(T0 + 60 * 60 * 1000);
	expect(window!.predictedAtMs).toBeNull();
});

// ---------- DynamicService.getUsageSeries ----------

type DynamicServiceWithDb = { db: unknown };
const dynamicServiceWithDb = DynamicService as unknown as DynamicServiceWithDb;
const originalDb = dynamicServiceWithDb.db;
const tempDir = mkdtempSync(join(tmpdir(), "node-fecth-usage-series-"));
const client = createClient({ url: `file:${join(tempDir, "usage.db")}` });
const seriesUrl = "https://series.example.com/sub";
let seriesId = "";

beforeAll(async () => {
	await client.execute(`CREATE TABLE dynamic (
		id TEXT PRIMARY KEY, url TEXT NOT NULL, content TEXT NOT NULL, traffic TEXT,
		created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL
	)`);
	await client.execute(`CREATE TABLE dynamic_history (
		id INTEGER PRIMARY KEY, dynamic_id TEXT NOT NULL, traffic TEXT, updated_at TEXT NOT NULL
	)`);
	seriesId = await hashUrl(seriesUrl);
	// 旧格式记录必须先于迁移插入：只有 traffic 文本、没有解析列和 fetched_at_ms，
	// 由迁移回填 fetched_at_ms，读取时再从 traffic 文本解析字节数。
	await client.execute({
		sql: "INSERT INTO dynamic_history (dynamic_id, traffic, updated_at) VALUES (?, ?, ?)",
		args: [seriesId, "upload=0; download=20; total=100; expire=1800000000", "2026-10-01 00:00:00"],
	});
	dynamicServiceWithDb.db = drizzle(client, { schema });
	// 触发一次查询以执行动态迁移（为 dynamic_history 补齐 fetched_at_ms 等列）
	await DynamicService.getUsageSeries(seriesUrl);
});

afterAll(() => {
	dynamicServiceWithDb.db = originalDb;
	client.close();
	rmSync(tempDir, { recursive: true, force: true });
});

test("getUsageSeries returns ascending points with parsed bytes and latest expiry", async () => {
	const base = Date.parse("2026-10-01T00:00:00+08:00");
	await client.batch([
		{
			sql: "INSERT INTO dynamic_history (dynamic_id, traffic, updated_at, fetched_at_ms, upload_bytes, download_bytes, total_bytes, expires_at_ms) VALUES (?, '', '', ?, ?, ?, ?, ?)",
			args: [seriesId, base + DAY, 5, 45, 100, 1800000000000],
		},
		{
			sql: "INSERT INTO dynamic_history (dynamic_id, traffic, updated_at, fetched_at_ms, upload_bytes, download_bytes, total_bytes, expires_at_ms) VALUES (?, '', '', ?, ?, ?, ?, ?)",
			args: [seriesId, base + 2 * DAY, 10, 50, 100, 1800000000000],
		},
	], "write");

	const series = await DynamicService.getUsageSeries(seriesUrl);
	expect(series.expiresAtMs).toBe(1800000000000);
	expect(series.points.map((p) => [p.t, p.remainingBytes, p.totalBytes])).toEqual([
		[base, 80, 100],
		[base + DAY, 50, 100],
		[base + 2 * DAY, 40, 100],
	]);
});

test("getUsageSeries downsamples long series while keeping first and last points", async () => {
	const url = "https://dense.example.com/sub";
	const id = await hashUrl(url);
	const base = Date.parse("2026-09-01T00:00:00+08:00");
	await client.batch(
		Array.from({ length: 300 }, (_, index) => ({
			sql: "INSERT INTO dynamic_history (dynamic_id, traffic, updated_at, fetched_at_ms, upload_bytes, download_bytes, total_bytes) VALUES (?, '', '', ?, 0, ?, 300)",
			args: [id, base + index * 60_000, index],
		})),
		"write",
	);

	const series = await DynamicService.getUsageSeries(url);
	expect(series.points.length).toBeLessThanOrEqual(240);
	expect(series.points.length).toBeGreaterThan(100);
	expect(series.points[0].t).toBe(base);
	expect(series.points[series.points.length - 1].t).toBe(base + 299 * 60_000);
	for (let i = 1; i < series.points.length; i++) {
		expect(series.points[i].t).toBeGreaterThan(series.points[i - 1].t);
	}
});

test("getUsageSeriesBatch groups rows per requested URL and keeps unknown URLs empty", async () => {
	const otherUrl = "https://batch.example.com/sub";
	const otherId = await hashUrl(otherUrl);
	const base = Date.parse("2026-10-05T00:00:00+08:00");
	await client.batch([
		{
			sql: "INSERT INTO dynamic_history (dynamic_id, traffic, updated_at, fetched_at_ms, upload_bytes, download_bytes, total_bytes, expires_at_ms) VALUES (?, '', '', ?, ?, ?, ?, ?)",
			args: [otherId, base, 10, 40, 100, 1800000000000],
		},
		{
			sql: "INSERT INTO dynamic_history (dynamic_id, traffic, updated_at, fetched_at_ms, upload_bytes, download_bytes, total_bytes, expires_at_ms) VALUES (?, '', '', ?, ?, ?, ?, ?)",
			args: [otherId, base + DAY, 20, 40, 100, 1800000000000],
		},
	], "write");

	const map = await DynamicService.getUsageSeriesBatch([seriesUrl, otherUrl, "https://missing.example.com/sub"]);
	expect(map.size).toBe(3);

	const other = map.get(otherUrl);
	expect(other?.expiresAtMs).toBe(1800000000000);
	expect(other?.points.map((p) => [p.t, p.remainingBytes])).toEqual([
		[base, 50],
		[base + DAY, 40],
	]);

	expect(map.get("https://missing.example.com/sub")).toEqual({ points: [], expiresAtMs: null });
	expect(map.get(seriesUrl)!.points.length).toBeGreaterThan(0);
});
