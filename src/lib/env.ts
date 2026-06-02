export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  // OPENAI
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-5.2",

  // OPENROUTER
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  openRouterModel:
    process.env.OPENROUTER_MODEL ??
    "deepseek/deepseek-chat-v3-0324:free",

  // GEMINI
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  geminiImageModel: process.env.GEMINI_IMAGE_MODEL,

  // XAI
  xaiApiKey: process.env.XAI_API_KEY,
  xaiModel: process.env.XAI_MODEL ?? "grok-4-fast-reasoning",

  // SUPABASE
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

export function hasSupabaseEnv() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function hasOpenAiEnv() {
  return Boolean(
    env.openAiApiKey ||
      env.openRouterApiKey ||
      env.geminiApiKey ||
      env.xaiApiKey,
  );
}