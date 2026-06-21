import { describe, expect, it } from "vitest";
import {
  creditActiveStudyMs,
  isStudySessionIdle,
  readingMinutesFromActiveMs,
  readingMinutesFromAnalyticsState,
} from "@/lib/study/active-study-time";

describe("active-study-time", () => {
  it("no acredita tiempo si la sesión está inactiva", () => {
    const now = 1_000_000;
    const state = {
      startedAt: now - 60 * 60_000,
      activeStudyMs: 120_000,
      lastActivityAt: now - 10 * 60_000,
      lastTickAt: now - 10 * 60_000,
    };

    expect(isStudySessionIdle(state, now)).toBe(true);
    const next = creditActiveStudyMs(state, now);
    expect(next.activeStudyMs).toBe(120_000);
  });

  it("acredita tiempo solo mientras hay actividad reciente", () => {
    const now = 2_000_000;
    const state = {
      startedAt: now - 30 * 60_000,
      activeStudyMs: 0,
      lastActivityAt: now - 30_000,
      lastTickAt: now - 60_000,
    };

    const next = creditActiveStudyMs(state, now);
    expect(next.activeStudyMs).toBe(60_000);
  });

  it("devuelve 0 minutos cuando no hay tiempo activo", () => {
    expect(readingMinutesFromActiveMs(0)).toBe(0);
    expect(readingMinutesFromAnalyticsState({})).toBe(0);
  });

  it("convierte milisegundos activos a minutos", () => {
    expect(readingMinutesFromActiveMs(7 * 60_000)).toBe(7);
  });
});
