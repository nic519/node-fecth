import { afterEach, beforeEach, expect, mock, test } from "bun:test";

import { DynamicService } from "../src/modules/dynamic/dynamic.service";
import { httpClient } from "../src/utils/http/client";

type DynamicServiceWithDb = typeof DynamicService & {
	db: {
		insert: () => {
			values: () => {
				onConflictDoUpdate: () => Promise<void>;
			};
		};
	};
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
