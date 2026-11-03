import { afterEach, beforeEach, expect, mock, spyOn, test } from "bun:test";

import { DynamicService } from "../src/modules/dynamic/dynamic.service";
import { httpClient } from "../src/utils/http/client";

type DynamicServiceWithDb = {
	db: unknown;
};

const dynamicServiceWithDb = DynamicService as unknown as DynamicServiceWithDb;
const originalDb = dynamicServiceWithDb.db;
const originalGet = httpClient.get;

function createDbStub() {
	return {
		insert() {
			return {
				values() {
					return {
						onConflictDoUpdate: async () => undefined,
					};
				},
			};
		},
	};
}

beforeEach(() => {
	dynamicServiceWithDb.db = createDbStub();
});

afterEach(() => {
	dynamicServiceWithDb.db = originalDb;
	httpClient.get = originalGet;
	mock.restore();
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
