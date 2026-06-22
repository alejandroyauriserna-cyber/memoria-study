import { markBetaJulyFirstUserAiGeneration } from "@/lib/beta/award-study-bonus";
import type { UserAiCredentials } from "@/lib/ai/user-ai-credentials";
import { usedUserAiCredentials } from "@/lib/ai/user-ai-credentials";

export async function recordUserAiGenerationIfNeeded(
  userId: string,
  credentials: UserAiCredentials,
  provider: "gemini" | "hf",
) {
  if (!usedUserAiCredentials(credentials, provider)) return;
  try {
    await markBetaJulyFirstUserAiGeneration(userId);
  } catch (error) {
    console.warn("[beta] first user AI generation bonus failed:", error);
  }
}
