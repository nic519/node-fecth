import { afterEach, beforeEach, expect, test } from "bun:test";

import { getRuntimeEnv } from "../src/db";

const originalSuperAdminToken = process.env.SUPER_ADMIN_TOKEN;
const originalTursoUrl = process.env.TURSO_DATABASE_URL;
const originalTursoToken = process.env.TURSO_AUTH_TOKEN;

beforeEach(() => {
	process.env.SUPER_ADMIN_TOKEN = "test-super-token";
	process.env.TURSO_DATABASE_URL = "libsql://example.turso.io";
	process.env.TURSO_AUTH_TOKEN = "test-auth-token";
});

afterEach(() => {
	if (originalSuperAdminToken === undefined) {
		Reflect.deleteProperty(process.env, "SUPER_ADMIN_TOKEN");
	} else {
		process.env.SUPER_ADMIN_TOKEN = originalSuperAdminToken;
	}

	if (originalTursoUrl === undefined) {
		Reflect.deleteProperty(process.env, "TURSO_DATABASE_URL");
	} else {
		process.env.TURSO_DATABASE_URL = originalTursoUrl;
	}

	if (originalTursoToken === undefined) {
		Reflect.deleteProperty(process.env, "TURSO_AUTH_TOKEN");
	} else {
		process.env.TURSO_AUTH_TOKEN = originalTursoToken;
	}
});

test("getRuntimeEnv falls back to process.env in local Next.js runtime", () => {
	const env = getRuntimeEnv();

	expect(env).toBeDefined();
	expect(env?.SUPER_ADMIN_TOKEN).toBe("test-super-token");
	expect(env?.TURSO_DATABASE_URL).toBe("libsql://example.turso.io");
	expect(env?.TURSO_AUTH_TOKEN).toBe("test-auth-token");
});
