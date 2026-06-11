import type { User } from "@supabase/supabase-js";

function normalizeEmail(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return null;
  return trimmed.replace(/^["']|["']$/g, "");
}

/** Correo canónico del usuario autenticado (Supabase puede guardarlo en varios campos). */
export function resolveUserEmail(user: User | null | undefined): string | null {
  if (!user) return null;

  const direct = normalizeEmail(user.email);
  if (direct) return direct;

  const meta = user.user_metadata as { email?: string } | undefined;
  const fromMeta = normalizeEmail(meta?.email);
  if (fromMeta) return fromMeta;

  for (const identity of user.identities ?? []) {
    const identityEmail = normalizeEmail(
      (identity.identity_data as { email?: string } | undefined)?.email,
    );
    if (identityEmail) return identityEmail;
  }

  return null;
}
