import { env } from "@/lib/env";

const DEFAULT_UNT_DOMAINS = ["unitru.edu.pe"];

function normalizeListEntry(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, "").toLowerCase();
}

function parseEmailList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map(normalizeListEntry)
    .filter(Boolean);
}

/** Lee JURISPRUDENCE_MODERATOR_EMAILS en runtime (evita quedar congelado en el build de Vercel). */
function readModeratorEmailsEnv(): string | undefined {
  return process.env.JURISPRUDENCE_MODERATOR_EMAILS;
}

function readUntDomainsEnv(): string | undefined {
  return process.env.JURISPRUDENCE_UNT_EMAIL_DOMAINS ?? env.jurisprudenceUntEmailDomains;
}

export function getUntEmailDomains(): string[] {
  const configured = parseEmailList(readUntDomainsEnv());
  return configured.length ? configured : DEFAULT_UNT_DOMAINS;
}

export function getEmailDomain(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return null;
  return normalized.split("@").pop() ?? null;
}

/** Cuenta institucional UNT (@unitru.edu.pe). */
export function isUntInstitutionalEmail(email: string | null | undefined): boolean {
  const domain = getEmailDomain(email);
  if (!domain) return false;
  return getUntEmailDomains().some((allowed) => domain === allowed || domain.endsWith(`.${allowed}`));
}

export function getUntAccessDenialMessage(): string {
  const domains = getUntEmailDomains().map((d) => `@${d}`).join(", ");
  return `Solo cuentas institucionales UNT (${domains}) pueden aportar o retirar sentencias. Inicia sesión con tu correo universitario.`;
}

export function getJurisprudenceModeratorEmails(): string[] {
  return parseEmailList(readModeratorEmailsEnv());
}

export function getModeratorAccessHint(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  const moderators = getJurisprudenceModeratorEmails();

  if (!normalized) {
    return "Inicia sesión con el correo que configuraste en JURISPRUDENCE_MODERATOR_EMAILS.";
  }

  if (moderators.length === 0) {
    return "JURISPRUDENCE_MODERATOR_EMAILS no está configurada en el servidor. Añádela y redeploy.";
  }

  if (moderators.includes(normalized)) return null;

  return `Tu sesión usa ${normalized}. Debe coincidir exactamente con JURISPRUDENCE_MODERATOR_EMAILS en el servidor (Vercel/hosting), no solo en .env.local.`;
}

/**
 * Moderación de aportes: emails en JURISPRUDENCE_MODERATOR_EMAILS (mismo correo de sesión).
 * En desarrollo, si la lista está vacía, cualquier usuario autenticado puede moderar.
 */
export function isJurisprudenceModerator(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;

  const moderators = getJurisprudenceModeratorEmails();
  if (moderators.includes(normalized)) return true;

  return process.env.NODE_ENV === "development" && moderators.length === 0;
}
