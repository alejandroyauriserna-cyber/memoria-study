import { readServerEnvList } from "@/lib/env/runtime";

const DEFAULT_UNT_DOMAINS = ["unitru.edu.pe"];

function parseEmailList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim().replace(/^["']|["']$/g, "").toLowerCase())
    .filter(Boolean);
}

export function getUntEmailDomains(): string[] {
  const configured = readServerEnvList("JURISPRUDENCE_UNT_EMAIL_DOMAINS");
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

export {
  getAllModeratorEmails,
  getEnvModeratorEmails,
  getJurisprudenceModeratorEmails,
  getModeratorAccessHint,
  isJurisprudenceModerator,
} from "@/lib/jurisprudence/moderator-emails";
