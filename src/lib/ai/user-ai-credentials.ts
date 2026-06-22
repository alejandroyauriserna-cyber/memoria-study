import { createAdminClient } from "@/lib/supabase/admin";
import { decryptUserSecret, encryptUserSecret, maskSecret } from "@/lib/crypto/user-secrets";
import { generateGeminiText } from "@/lib/ai/gemini-text";
import { generateFluxImage } from "@/lib/ai/hf-flux-image-provider";
import { awardBetaJulyStepBonus } from "@/lib/beta/award-study-bonus";

export type UserAiCredentials = {
  geminiApiKey?: string;
  hfToken?: string;
};

export type UserAiCredentialsStatus = {
  geminiConfigured: boolean;
  hfConfigured: boolean;
  geminiMasked: string | null;
  hfMasked: string | null;
};

type ProfileCredentialRow = {
  ai_gemini_key_encrypted: string | null;
  ai_hf_token_encrypted: string | null;
};

export async function getUserAiCredentials(userId: string): Promise<UserAiCredentials> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_profiles")
    .select("ai_gemini_key_encrypted, ai_hf_token_encrypted")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const row = (data ?? {}) as ProfileCredentialRow;
  const credentials: UserAiCredentials = {};

  if (row.ai_gemini_key_encrypted) {
    credentials.geminiApiKey = decryptUserSecret(row.ai_gemini_key_encrypted);
  }
  if (row.ai_hf_token_encrypted) {
    credentials.hfToken = decryptUserSecret(row.ai_hf_token_encrypted);
  }

  return credentials;
}

export async function getUserAiCredentialsStatus(userId: string): Promise<UserAiCredentialsStatus> {
  const credentials = await getUserAiCredentials(userId);

  return {
    geminiConfigured: Boolean(credentials.geminiApiKey),
    hfConfigured: Boolean(credentials.hfToken),
    geminiMasked: credentials.geminiApiKey ? maskSecret(credentials.geminiApiKey) : null,
    hfMasked: credentials.hfToken ? maskSecret(credentials.hfToken) : null,
  };
}

async function validateGeminiKey(apiKey: string): Promise<void> {
  await generateGeminiText({
    prompt: 'Responde solo con la palabra "ok".',
    apiKey,
    temperature: 0,
    timeoutMs: 25_000,
  });
}

async function validateHfToken(token: string): Promise<void> {
  const result = await generateFluxImage(
    "Simple cyan circle icon on dark background, minimal",
    { aspectRatio: "1:1", profileAvatar: true, hfToken: token },
  );
  if (!result.ok) {
    throw new Error(result.lastError);
  }
}

export async function saveUserGeminiKey(userId: string, apiKey: string): Promise<UserAiCredentialsStatus> {
  const trimmed = apiKey.trim();
  if (trimmed.length < 20) {
    throw new Error("La API key de Gemini parece demasiado corta.");
  }

  await validateGeminiKey(trimmed);

  const admin = createAdminClient();
  const { error } = await admin.from("user_profiles").upsert(
    {
      user_id: userId,
      ai_gemini_key_encrypted: encryptUserSecret(trimmed),
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;

  await awardBetaJulyStepBonus(userId, "gemini");

  return getUserAiCredentialsStatus(userId);
}

export async function saveUserHfToken(userId: string, token: string): Promise<UserAiCredentialsStatus> {
  const trimmed = token.trim();
  if (!trimmed.startsWith("hf_")) {
    throw new Error("El token de Hugging Face debe empezar por hf_.");
  }

  await validateHfToken(trimmed);

  const admin = createAdminClient();
  const { error } = await admin.from("user_profiles").upsert(
    {
      user_id: userId,
      ai_hf_token_encrypted: encryptUserSecret(trimmed),
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;

  await awardBetaJulyStepBonus(userId, "hf");

  return getUserAiCredentialsStatus(userId);
}

export async function removeUserAiCredential(
  userId: string,
  provider: "gemini" | "hf",
): Promise<UserAiCredentialsStatus> {
  const admin = createAdminClient();
  const patch =
    provider === "gemini"
      ? { ai_gemini_key_encrypted: null }
      : { ai_hf_token_encrypted: null };

  const { error } = await admin.from("user_profiles").update(patch).eq("user_id", userId);
  if (error) throw error;

  return getUserAiCredentialsStatus(userId);
}

export function usedUserAiCredentials(
  credentials: UserAiCredentials,
  provider: "gemini" | "hf",
): boolean {
  if (provider === "gemini") return Boolean(credentials.geminiApiKey);
  return Boolean(credentials.hfToken);
}
