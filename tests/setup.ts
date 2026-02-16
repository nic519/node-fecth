import { mock } from "bun:test";

// Mock server-only to prevent it from throwing error in tests
mock.module("server-only", () => {
  return {};
});

// Mock @cloudflare/next-on-pages
mock.module("@cloudflare/next-on-pages", () => {
  return {
    getRequestContext: () => ({
      env: {
        DB: {
          prepare: () => ({
            bind: () => ({
              first: async () => null,
              all: async () => [],
              run: async () => ({ success: true }),
            }),
          }),
        },
      },
      cf: {},
      ctx: {
        waitUntil: () => {},
        passThroughOnException: () => {},
      },
    }),
  };
});
