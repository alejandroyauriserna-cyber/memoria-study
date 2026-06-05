import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/api/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests within the limit", () => {
    const key = `test-${Date.now()}`;
    const first = checkRateLimit(key, 3, 60_000);
    expect(first.allowed).toBe(true);
    if (first.allowed) expect(first.remaining).toBe(2);
  });

  it("blocks when limit exceeded", () => {
    const key = `block-${Date.now()}`;
    checkRateLimit(key, 1, 60_000);
    const second = checkRateLimit(key, 1, 60_000);
    expect(second.allowed).toBe(false);
  });
});
