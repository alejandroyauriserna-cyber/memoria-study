import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/study/active-study-time-reset", () => ({
  ensureActiveStudyTimeReset: vi.fn(),
}));

vi.mock("@/lib/study/client-active-study-total", () => ({
  sumClientActiveStudyMilliseconds: vi.fn(() => 120_000),
}));

describe("syncActiveStudyTimeToServer", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true })) as unknown as typeof fetch,
    );
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("no repite PUT si los milisegundos activos no cambiaron", async () => {
    const { syncActiveStudyTimeToServer } = await import("@/lib/study/sync-active-study-time");
    await syncActiveStudyTimeToServer();
    await syncActiveStudyTimeToServer();

    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
