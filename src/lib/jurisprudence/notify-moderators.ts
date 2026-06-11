import { env } from "@/lib/env";
import { readServerEnv } from "@/lib/env/runtime";
import { getJurisprudenceModeratorEmails, getUntEmailDomains } from "@/lib/jurisprudence/unt-access";

export async function notifyJurisprudenceModerators(input: {
  documentId: string;
  title: string;
  submitterEmail?: string | null;
  autoPublished?: boolean;
}): Promise<void> {
  const moderators = getJurisprudenceModeratorEmails();
  if (!moderators.length) return;

  const appUrl = env.appUrl.replace(/\/$/, "");
  const adminUrl = `${appUrl}/admin/biblioteca-juridica`;
  const subject = input.autoPublished
    ? `[Biblioteca Jurídica] Aporte auto-publicado: ${input.title}`
    : `[Biblioteca Jurídica] Nuevo aporte pendiente: ${input.title}`;

  const bodyText = [
    input.autoPublished
      ? "Un aporte de colaborador de confianza se publicó automáticamente."
      : "Hay un nuevo aporte pendiente de revisión.",
    "",
    `Título: ${input.title}`,
    `ID: ${input.documentId}`,
    input.submitterEmail ? `Autor: ${input.submitterEmail}` : null,
    "",
    `Revisar en: ${adminUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const resendKey = readServerEnv("RESEND_API_KEY");
  const fromEmail =
    readServerEnv("JURISPRUDENCE_NOTIFY_FROM_EMAIL") ??
    "Biblioteca Jurídica <noreply@memoriastudy.local>";

  if (!resendKey) {
    console.info("[jurisprudence/notify]", subject, bodyText);
    return;
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: moderators,
        subject,
        text: bodyText,
      }),
    });
  } catch (error) {
    console.error("[jurisprudence/notify] Resend failed:", error);
  }
}

export function formatUntDomainsForEmail(): string {
  return getUntEmailDomains().map((d) => `@${d}`).join(", ");
}
