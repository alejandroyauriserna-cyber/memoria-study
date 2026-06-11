import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";
import { readServerEnv } from "@/lib/env/runtime";

const CACHE_MS = 60_000;

let dbModeratorEmails: string[] = [];
let dbModeratorsFetchedAt = 0;

function parseEmailList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim().replace(/^["']|["']$/g, "").toLowerCase())
    .filter(Boolean);
}

/** Emails desde JURISPRUDENCE_MODERATOR_EMAILS (env / Vercel). */
export function getEnvModeratorEmails(): string[] {
  return parseEmailList(readServerEnv("JURISPRUDENCE_MODERATOR_EMAILS"));
}

async function fetchDbModeratorEmails(): Promise<string[]> {
  if (!hasSupabaseEnv()) return [];

  const now = Date.now();
  if (now - dbModeratorsFetchedAt < CACHE_MS && dbModeratorEmails.length > 0) {
    return dbModeratorEmails;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("jurisprudence_moderators").select("email");
    if (error) {
      if (error.code !== "42P01") {
        console.warn("[jurisprudence/moderators] DB read failed:", error.message);
      }
      return dbModeratorEmails;
    }

    dbModeratorEmails = (data ?? [])
      .map((row) => String(row.email).trim().toLowerCase())
      .filter(Boolean);
    dbModeratorsFetchedAt = now;
    return dbModeratorEmails;
  } catch {
    return dbModeratorEmails;
  }
}

/** Env + Supabase (tabla jurisprudence_moderators). */
export async function getAllModeratorEmails(): Promise<string[]> {
  const fromEnv = getEnvModeratorEmails();
  const fromDb = await fetchDbModeratorEmails();
  return [...new Set([...fromEnv, ...fromDb])];
}

export async function isJurisprudenceModerator(
  email: string | null | undefined,
): Promise<boolean> {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;

  const moderators = await getAllModeratorEmails();
  if (moderators.includes(normalized)) return true;

  return process.env.NODE_ENV === "development" && moderators.length === 0;
}

export async function getModeratorAccessHint(
  email: string | null | undefined,
  options?: { isUntInstitutional?: boolean },
): Promise<string | null> {
  if (!options?.isUntInstitutional) return null;

  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;

  const moderators = await getAllModeratorEmails();
  if (moderators.includes(normalized) || moderators.length === 0) return null;

  return "Tu cuenta UNT aún no tiene permiso para moderar aportes. Si administras la biblioteca, contacta al equipo técnico.";
}

/** Solo env — preferir getAllModeratorEmails para notificaciones. */
export function getJurisprudenceModeratorEmails(): string[] {
  return getEnvModeratorEmails();
}
