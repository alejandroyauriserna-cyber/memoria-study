import type { SupabaseClient } from "@supabase/supabase-js";

export async function resolveSubmitterEmail(
  admin: SupabaseClient,
  userId: string | null | undefined,
): Promise<string | null> {
  if (!userId) return null;

  const { data: profile } = await admin
    .from("user_profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.email?.trim()) return profile.email.trim();

  const { data: authData, error } = await admin.auth.admin.getUserById(userId);
  if (error) return null;
  return authData.user?.email?.trim() ?? null;
}
