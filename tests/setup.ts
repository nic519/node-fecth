import { mock } from "bun:test";

// Mock server-only to prevent it from throwing error in tests
mock.module("server-only", () => {
  return {};
});
