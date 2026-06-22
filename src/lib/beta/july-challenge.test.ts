import { describe, expect, it } from "vitest";
import {
  BETA_AI_BONUS_MAX_MS,
  BETA_AI_BONUS_MS,
  buildBetaJulyChallengeStatus,
  isBetaJulyChallengeActive,
} from "@/lib/beta/july-challenge";

describe("july-challenge", () => {
  it("calcula display vs premio correctamente", () => {
    const status = buildBetaJulyChallengeStatus({
      betaJulyActiveMs: 4 * 60 * 60 * 1000,
      bonusStudyMs: BETA_AI_BONUS_MS.gemini,
      betaAiGeminiAt: "2026-07-22T12:00:00.000Z",
      betaAiHfAt: null,
      betaAiFirstGenAt: null,
      geminiConfigured: true,
      hfConfigured: false,
      now: new Date("2026-07-22T18:00:00.000Z"),
    });

    expect(status.realStudyMs).toBe(4 * 60 * 60 * 1000);
    expect(status.bonusStudyMs).toBe(BETA_AI_BONUS_MS.gemini);
    expect(status.displayStudyMs).toBe(status.realStudyMs + status.bonusStudyMs);
    expect(status.prizeEligible).toBe(false);
    expect(status.active).toBe(true);
  });

  it("marca elegible con 5h reales", () => {
    const status = buildBetaJulyChallengeStatus({
      betaJulyActiveMs: 5 * 60 * 60 * 1000,
      bonusStudyMs: BETA_AI_BONUS_MAX_MS,
      betaAiGeminiAt: "x",
      betaAiHfAt: "x",
      betaAiFirstGenAt: "x",
      geminiConfigured: true,
      hfConfigured: true,
      now: new Date("2026-07-23T12:00:00.000Z"),
    });

    expect(status.prizeEligible).toBe(true);
  });

  it("detecta ventana activa del reto", () => {
    expect(isBetaJulyChallengeActive(new Date("2026-07-21T10:00:00.000Z"))).toBe(true);
    expect(isBetaJulyChallengeActive(new Date("2026-06-22T10:00:00.000Z"))).toBe(false);
  });
});
