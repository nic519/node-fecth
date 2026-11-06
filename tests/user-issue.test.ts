import { expect, test } from "bun:test";

import { depletingAtMs, userIssue } from "../src/app/admin/users/utils/userUtils";
import type { SubscriptionStat, UserAdminConfig } from "../src/modules/user/admin.schema";

const NOW = Date.parse("2026-11-05T00:00:00+08:00");
const DAY = 86400_000;

const traffic = (used: number, total: number, expireSec?: number) =>
	`upload=${used}; download=0; total=${total}${expireSec ? `; expire=${expireSec}` : ""}`;

const statOf = (partial: Partial<SubscriptionStat>): SubscriptionStat => ({
	url: "https://example.com/sub",
	type: "append",
	name: "源",
	...partial,
});

const userOf = (stat: SubscriptionStat): UserAdminConfig =>
	({ uid: "u", updatedAt: "", subscriptionStats: [stat] }) as UserAdminConfig;

test("depletingAtMs returns prediction within two weeks and before expiry", () => {
	const stat = statOf({
		traffic: traffic(10, 100, Math.floor((NOW + 30 * DAY) / 1000)),
		predictedExhaustionAtMs: NOW + 5 * DAY,
	});
	expect(depletingAtMs(stat, NOW)).toBe(NOW + 5 * DAY);
});

test("depletingAtMs ignores predictions later than expiry or beyond two weeks", () => {
	// 到期更早：耗尽预测在到期之后，由“即将到期”告警覆盖
	expect(depletingAtMs(statOf({
		traffic: traffic(10, 100, Math.floor((NOW + 3 * DAY) / 1000)),
		predictedExhaustionAtMs: NOW + 10 * DAY,
	}), NOW)).toBeNull();
	// 超过两周窗口
	expect(depletingAtMs(statOf({
		traffic: traffic(10, 100),
		predictedExhaustionAtMs: NOW + 20 * DAY,
	}), NOW)).toBeNull();
	// 没有预测
	expect(depletingAtMs(statOf({
		traffic: traffic(10, 100),
		predictedExhaustionAtMs: null,
	}), NOW)).toBeNull();
});

test("userIssue ranks tight above depleting above expiring", () => {
	const tight = userIssue(userOf(statOf({
		traffic: traffic(95, 100),
		predictedExhaustionAtMs: Date.now() + DAY,
	})));
	expect(tight?.kind).toBe("tight");
	expect(tight?.rank).toBe(0);

	const depleting = userIssue(userOf(statOf({
		traffic: traffic(50, 100),
		predictedExhaustionAtMs: Date.now() + 2 * DAY,
	})));
	expect(depleting?.kind).toBe("depleting");
	expect(depleting?.rank).toBe(1);
	expect(depleting?.label).toBe("消耗过快");

	const expiring = userIssue(userOf(statOf({
		traffic: traffic(50, 100, Math.floor((Date.now() + 3 * DAY) / 1000)),
	})));
	expect(expiring?.kind).toBe("expiring");
	expect(expiring?.rank).toBe(2);
});

test("userIssue prefers the worst issue across multiple subscriptions", () => {
	const user = {
		uid: "u",
		updatedAt: "",
		subscriptionStats: [
			statOf({ traffic: traffic(50, 100, Math.floor((Date.now() + 3 * DAY) / 1000)) }),
			statOf({ url: "https://example.com/fast", traffic: traffic(50, 100), predictedExhaustionAtMs: Date.now() + DAY }),
		],
	} as UserAdminConfig;
	expect(userIssue(user)?.kind).toBe("depleting");
});
