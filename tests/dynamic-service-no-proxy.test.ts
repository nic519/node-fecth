import { createClient } from "@libsql/client";
import { afterAll, afterEach, beforeAll, expect, mock, spyOn, test } from "bun:test";
import { drizzle } from "drizzle-orm/libsql";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import * as schema from "../src/db/schema";
import { DynamicService } from "../src/modules/dynamic/dynamic.service";
import { hashUrl } from "../src/utils/hashUtils";
import { httpClient } from "../src/utils/http/client";
import { logger } from "../src/utils/request/network.config";

type DynamicServiceWithDb = {
	db: unknown;
};

const dynamicServiceWithDb = DynamicService as unknown as DynamicServiceWithDb;
const originalDb = dynamicServiceWithDb.db;
const originalGet = httpClient.get;
const tempDir = mkdtempSync(join(tmpdir(), "node-fecth-history-"));
const client = createClient({ url: `file:${join(tempDir, "history.db")}` });
const historyUrl = "https://history.example.com/sub";
const previousTraffic = "download=1; total=100";
const previousUpdatedAt = "2026-11-01 12:00:00";

beforeAll(async () => {
	await client.execute(`CREATE TABLE dynamic (
		id TEXT PRIMARY KEY, url TEXT NOT NULL, content TEXT NOT NULL, traffic TEXT,
		created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL
	)`);
	await client.execute(`CREATE TABLE dynamic_history (
		id INTEGER PRIMARY KEY, dynamic_id TEXT NOT NULL, traffic TEXT, updated_at TEXT NOT NULL
	)`);
	await client.execute({
		sql: "INSERT INTO dynamic_history VALUES (20, ?, ?, ?)",
		args: [await hashUrl("https://legacy.example.com/sub"), "upload=0; download=40; total=100; expire=1800000000", previousUpdatedAt],
	});
	const db = drizzle(client, { schema });
	await db.insert(schema.dynamic).values({
		id: await hashUrl(historyUrl),
		url: historyUrl,
		content: "previous-content",
		traffic: previousTraffic,
		updatedAt: previousUpdatedAt,
	});
	dynamicServiceWithDb.db = db;
});

afterAll(() => {
	dynamicServiceWithDb.db = originalDb;
	client.close();
	rmSync(tempDir, { recursive: true, force: true });
});

afterEach(() => {
	httpClient.get = originalGet;
	mock.restore();
});

test("retains the previous snapshot and records each successful upstream fetch", async () => {
	const traffic = "upload=1; download=2; total=100";
	spyOn(logger, "error").mockImplementation(() => {});
	const fetch = spyOn(globalThis, "fetch")
		.mockResolvedValueOnce(new Response("fresh-content", { headers: { "Subscription-Userinfo": traffic } }))
		.mockResolvedValueOnce(new Response("fresh-content"))
		.mockRejectedValueOnce(new Error("upstream unavailable"));

	const first = await DynamicService.fetchAndSave(`  ${historyUrl}  `, { retries: 0 });
	const second = await DynamicService.fetchAndSave(historyUrl, { retries: 0 });
	expect(await DynamicService.getWithCache(historyUrl)).toEqual(second);
	await expect(DynamicService.fetchAndSave(historyUrl, { retries: 0 })).rejects.toThrow("upstream unavailable");
	expect(fetch).toHaveBeenCalledTimes(3);
	expect(await DynamicService.getByUrl(historyUrl)).toEqual(second);

	const tables = await client.execute("SELECT name FROM sqlite_master WHERE name = 'dynamic_history'");
	expect(tables.rows).toHaveLength(1);
	const history = await client.execute({
		sql: "SELECT traffic, updated_at, upload_bytes, download_bytes, total_bytes FROM dynamic_history WHERE dynamic_id = ? ORDER BY id",
		args: [first.id],
	});
	expect(history.rows.map(({ traffic, updated_at }) => [traffic, updated_at])).toEqual([
		[previousTraffic, previousUpdatedAt],
		[traffic, first.updatedAt],
		[null, second.updatedAt],
	]);
	expect(history.rows[1]).toMatchObject({ upload_bytes: 1, download_bytes: 2, total_bytes: 100 });
	const page = await DynamicService.getHistory(historyUrl);
	expect(page.records.map(({ remainingBytes, totalBytes }) => [remainingBytes, totalBytes])).toEqual([
		[null, null],
		[97, 100],
		[null, 100],
	]);
	expect(page.records[2].fetchedAtMs).toBe(Date.parse("2026-11-01T12:00:00+08:00"));
	expect(await DynamicService.getHistory("https://legacy.example.com/sub")).toEqual({
		records: [{
			id: 20,
			fetchedAtMs: Date.parse("2026-11-01T12:00:00+08:00"),
			remainingBytes: 60,
			totalBytes: 100,
			expiresAtMs: 1800000000000,
		}],
		nextCursor: null,
	});
});

test("pages history by descending time and ID, retaining unknown dates and real zeroes", async () => {
	const url = "https://paged.example.com/sub";
	const id = await hashUrl(url);
	await DynamicService.getHistory(url);
	const recentTime = Date.parse("2026-11-02T08:00:00Z");
	await client.batch([
		...Array.from({ length: 51 }, () => ({
			sql: "INSERT INTO dynamic_history (dynamic_id, updated_at, fetched_at_ms, upload_bytes, download_bytes, total_bytes) VALUES (?, '', ?, 0, 2, 2)",
			args: [id, recentTime],
		})),
		{ sql: "INSERT INTO dynamic_history (dynamic_id, updated_at, fetched_at_ms) VALUES (?, '', ?)", args: [id, recentTime + 1] },
		{ sql: "INSERT INTO dynamic_history (dynamic_id, updated_at) VALUES (?, 'invalid')", args: [id] },
	], "write");

	const first = await DynamicService.getHistory(url);
	expect(first.records).toHaveLength(50);
	expect(first.records[0].fetchedAtMs).toBe(recentTime + 1);
	expect(first.records[1]).toMatchObject({ remainingBytes: 0, totalBytes: 2 });
	expect(first.nextCursor).not.toBeNull();
	const second = await DynamicService.getHistory(url, first.nextCursor ?? undefined);
	expect(second.records).toHaveLength(3);
	expect(second.records[0].id).toBeLessThan(first.records[49].id);
	expect(second.records.at(-1)?.fetchedAtMs).toBeNull();
	expect(second.nextCursor).toBeNull();
});

test("keeps the latest cache intact if its history write fails", async () => {
	const url = "https://rollback.example.com/sub";
	spyOn(logger, "error").mockImplementation(() => {});
	spyOn(globalThis, "fetch")
		.mockResolvedValueOnce(new Response("previous-content"))
		.mockResolvedValueOnce(new Response("replacement-content", {
			headers: { "Subscription-Userinfo": "download=3" },
		}));

	const previous = await DynamicService.fetchAndSave(url, { retries: 0 });
	await client.execute(`CREATE TRIGGER reject_history_write BEFORE INSERT ON dynamic_history
		WHEN NEW.traffic = 'download=3'
		BEGIN SELECT RAISE(ABORT, 'history write rejected'); END`);
	try {
		await expect(DynamicService.fetchAndSave(url, { retries: 0 })).rejects.toThrow("history write rejected");
		expect(await DynamicService.getByUrl(url)).toEqual(previous);
	} finally {
		await client.execute("DROP TRIGGER reject_history_write");
	}
});

test("DynamicService.fetchAndSave uses normalized source URL directly", async () => {
	const requestedUrls: string[] = [];

	httpClient.get = (async (url: string) => {
		requestedUrls.push(url);
		return {
			text: async () => "mock-content",
			headers: new Headers(),
		};
	}) as typeof httpClient.get;

	await DynamicService.fetchAndSave("  https://liangxin.xyz/sub  ", { retries: 0 });

	expect(requestedUrls).toEqual(["https://liangxin.xyz/sub"]);
});

test("DynamicService.fetchAndSave uses the configured proxy provider request URL", async () => {
	const requestedUrls: string[] = [];

	httpClient.get = (async (url: string) => {
		requestedUrls.push(url);
		return {
			text: async () => "mock-content",
			headers: new Headers(),
		};
	}) as typeof httpClient.get;

	await DynamicService.fetchAndSave("https://liangxin.xyz/sub", {
		retries: 0,
		proxyProvider: "cloudflare",
	});

	expect(requestedUrls).toEqual([
		"https://transfer-v.lavamusic.workers.dev/api/proxy?url=https%3A%2F%2Fliangxin.xyz%2Fsub",
	]);
});

test.each([
	["fresh", "2026-11-03 11:34:00", "cached-content"],
	["expired", "2026-11-03 11:22:33", "fresh-content"],
	["at the TTL boundary", "2026-11-03 11:31:00", "fresh-content"],
	["in the future", "2026-11-03 11:37:00", "fresh-content"],
	["invalid", "invalid-date", "fresh-content"],
])("DynamicService.getWithCache handles %s Beijing timestamps", async (_label, updatedAt, expectedContent) => {
	spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-03T03:36:00Z"));
	spyOn(DynamicService, "getByUrl").mockResolvedValue({
		id: "cached-id",
		url: "https://example.com/sub",
		content: "cached-content",
		traffic: null,
		updatedAt,
	});
	spyOn(globalThis, "fetch").mockResolvedValue(new Response("fresh-content"));

	const result = await DynamicService.getWithCache("https://example.com/sub");

	expect(result.content).toBe(expectedContent);
});
