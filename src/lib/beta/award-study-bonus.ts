import { createAdminClient } from "@/lib/supabase/admin";
import {
  BETA_AI_BONUS_MS,
  type BetaJulyStepId,
  isBetaJulyChallengeActive,
} from "@/lib/beta/july-challenge";

type ProfileBonusRow = {
  bonus_study_ms: number | null;
  beta_ai_gemini_at: string | null;
  beta_ai_hf_at: string | null;
  beta_ai_first_gen_at: string | null;
};

const STEP_COLUMN: Record<BetaJulyStepId, keyof ProfileBonusRow> = {
  gemini: "beta_ai_gemini_at",
  hf: "beta_ai_hf_at",
  firstGeneration: "beta_ai_first_gen_at",
};

export type AwardBonusResult =
  | { awarded: true; bonusMs: number; totalBonusMs: number }
  | { awarded: false; reason: "already_awarded" | "challenge_inactive" };

export async function awardBetaJulyStepBonus(
  userId: string,
  step: BetaJulyStepId,
): Promise<AwardBonusResult> {
  if (!isBetaJulyChallengeActive()) {
    return { awarded: false, reason: "challenge_inactive" };
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("user_profiles")
    .select("bonus_study_ms, beta_ai_gemini_at, beta_ai_hf_at, beta_ai_first_gen_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const profile = (row ?? {}) as ProfileBonusRow;
  const column = STEP_COLUMN[step];
  if (profile[column]) {
    return { awarded: false, reason: "already_awarded" };
  }

  const bonusMs = BETA_AI_BONUS_MS[step];
  const currentBonus = Number(profile.bonus_study_ms ?? 0);
  const totalBonusMs = currentBonus + bonusMs;
  const now = new Date().toISOString();

  const { error: updateError } = await admin.from("user_profiles").upsert(
    {
      user_id: userId,
      bonus_study_ms: totalBonusMs,
      [column]: now,
    },
    { onConflict: "user_id" },
  );

  if (updateError) throw updateError;

  return { awarded: true, bonusMs, totalBonusMs };
}

export async function markBetaJulyFirstUserAiGeneration(userId: string): Promise<AwardBonusResult> {
  return awardBetaJulyStepBonus(userId, "firstGeneration");
}
