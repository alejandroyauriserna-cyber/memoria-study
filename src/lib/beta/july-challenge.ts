/** Reto beta julio 2026 — America/Lima (UTC-5). */
export const BETA_JULY_TIMEZONE = "America/Lima";

/** 21 jul 2026 00:00 Lima */
export const BETA_JULY_START = new Date("2026-07-21T05:00:00.000Z");

/** 28 jul 2026 00:00 Lima (fin del 27) */
export const BETA_JULY_END = new Date("2026-07-28T05:00:00.000Z");

export const BETA_JULY_PRIZE_MIN_MS = 5 * 60 * 60 * 1000;
export const BETA_JULY_PRIZE_AMOUNT_PEN = 40;

export const BETA_AI_BONUS_MS = {
  gemini: 45 * 60 * 1000,
  hf: 30 * 60 * 1000,
  firstGeneration: 15 * 60 * 1000,
} as const;

export const BETA_AI_BONUS_MAX_MS =
  BETA_AI_BONUS_MS.gemini + BETA_AI_BONUS_MS.hf + BETA_AI_BONUS_MS.firstGeneration;

export type BetaJulyStepId = "gemini" | "hf" | "firstGeneration";

export type BetaJulyStep = {
  id: BetaJulyStepId;
  label: string;
  description: string;
  bonusMs: number;
  completed: boolean;
  completedAt: string | null;
};

export type BetaJulyChallengeStatus = {
  active: boolean;
  upcoming: boolean;
  ended: boolean;
  startsAt: string;
  endsAt: string;
  prizeAmountPen: number;
  prizeMinHours: number;
  bonusMaxHours: number;
  realStudyMs: number;
  bonusStudyMs: number;
  displayStudyMs: number;
  prizeEligible: boolean;
  prizeEligibleMs: number;
  steps: BetaJulyStep[];
  geminiConnected: boolean;
  hfConnected: boolean;
};

export function isBetaJulyChallengeActive(now = new Date()): boolean {
  return now >= BETA_JULY_START && now < BETA_JULY_END;
}

export function isBetaJulyChallengeUpcoming(now = new Date()): boolean {
  return now < BETA_JULY_START;
}

export function isBetaJulyChallengeEnded(now = new Date()): boolean {
  return now >= BETA_JULY_END;
}

export function formatBetaChallengeDate(date: Date): string {
  return date.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    timeZone: BETA_JULY_TIMEZONE,
  });
}

export function buildBetaJulySteps(input: {
  betaAiGeminiAt: string | null;
  betaAiHfAt: string | null;
  betaAiFirstGenAt: string | null;
}): BetaJulyStep[] {
  return [
    {
      id: "gemini",
      label: "Conectar Gemini",
      description: "API key gratis en Google AI Studio (texto, mazos, tutor).",
      bonusMs: BETA_AI_BONUS_MS.gemini,
      completed: Boolean(input.betaAiGeminiAt),
      completedAt: input.betaAiGeminiAt,
    },
    {
      id: "hf",
      label: "Conectar Hugging Face",
      description: "Token con Inference Providers (avatares e imágenes FLUX).",
      bonusMs: BETA_AI_BONUS_MS.hf,
      completed: Boolean(input.betaAiHfAt),
      completedAt: input.betaAiHfAt,
    },
    {
      id: "firstGeneration",
      label: "Primera generación con tu IA",
      description: "Genera un mazo, organizador o avatar usando tus claves.",
      bonusMs: BETA_AI_BONUS_MS.firstGeneration,
      completed: Boolean(input.betaAiFirstGenAt),
      completedAt: input.betaAiFirstGenAt,
    },
  ];
}

export function buildBetaJulyChallengeStatus(input: {
  betaJulyActiveMs: number;
  bonusStudyMs: number;
  betaAiGeminiAt: string | null;
  betaAiHfAt: string | null;
  betaAiFirstGenAt: string | null;
  geminiConfigured: boolean;
  hfConfigured: boolean;
  now?: Date;
}): BetaJulyChallengeStatus {
  const now = input.now ?? new Date();
  const realStudyMs = Math.max(0, input.betaJulyActiveMs);
  const bonusStudyMs = Math.max(0, input.bonusStudyMs);
  const displayStudyMs = realStudyMs + bonusStudyMs;

  return {
    active: isBetaJulyChallengeActive(now),
    upcoming: isBetaJulyChallengeUpcoming(now),
    ended: isBetaJulyChallengeEnded(now),
    startsAt: BETA_JULY_START.toISOString(),
    endsAt: BETA_JULY_END.toISOString(),
    prizeAmountPen: BETA_JULY_PRIZE_AMOUNT_PEN,
    prizeMinHours: BETA_JULY_PRIZE_MIN_MS / (60 * 60 * 1000),
    bonusMaxHours: BETA_AI_BONUS_MAX_MS / (60 * 60 * 1000),
    realStudyMs,
    bonusStudyMs,
    displayStudyMs,
    prizeEligible: realStudyMs >= BETA_JULY_PRIZE_MIN_MS,
    prizeEligibleMs: realStudyMs,
    steps: buildBetaJulySteps({
      betaAiGeminiAt: input.betaAiGeminiAt,
      betaAiHfAt: input.betaAiHfAt,
      betaAiFirstGenAt: input.betaAiFirstGenAt,
    }),
    geminiConnected: input.geminiConfigured,
    hfConnected: input.hfConfigured,
  };
}
