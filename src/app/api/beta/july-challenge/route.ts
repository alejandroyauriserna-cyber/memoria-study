import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildBetaJulyChallengeStatus } from "@/lib/beta/july-challenge";
import { getUserAiCredentialsStatus } from "@/lib/ai/user-ai-credentials";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const admin = createAdminClient();
    const [{ data: profile, error: profileError }, credentials] = await Promise.all([
      admin
        .from("user_profiles")
        .select(
          "beta_july_active_ms, bonus_study_ms, beta_ai_gemini_at, beta_ai_hf_at, beta_ai_first_gen_at",
        )
        .eq("user_id", auth.user.id)
        .maybeSingle(),
      getUserAiCredentialsStatus(auth.user.id),
    ]);

    if (profileError) throw profileError;

    const status = buildBetaJulyChallengeStatus({
      betaJulyActiveMs: Number(profile?.beta_july_active_ms ?? 0),
      bonusStudyMs: Number(profile?.bonus_study_ms ?? 0),
      betaAiGeminiAt: profile?.beta_ai_gemini_at ?? null,
      betaAiHfAt: profile?.beta_ai_hf_at ?? null,
      betaAiFirstGenAt: profile?.beta_ai_first_gen_at ?? null,
      geminiConfigured: credentials.geminiConfigured,
      hfConfigured: credentials.hfConfigured,
    });

    return NextResponse.json(status);
  } catch (caught) {
    console.error("[beta/july-challenge GET]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo cargar el reto." },
      { status: 500 },
    );
  }
}
