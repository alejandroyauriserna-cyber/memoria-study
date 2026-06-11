import { env } from "@/lib/env";

const DEFAULT_UNT_DOMAINS = ["unitru.edu.pe"];

function parseEmailList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function getUntEmailDomains(): string[] {
  const configured = parseEmailList(env.jurisprudenceUntEmailDomains);
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

export function isJurisprudenceModerator(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  const moderators = parseEmailList(env.jurisprudenceModeratorEmails);
  return moderators.includes(normalized);
}
