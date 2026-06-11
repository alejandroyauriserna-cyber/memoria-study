import { env } from "@/lib/env";
import { readServerEnv } from "@/lib/env/runtime";

export async function notifyJurisprudenceContributor(input: {
  toEmail: string;
  title: string;
  action: "approved" | "rejected";
  rejectionReason?: string | null;
}): Promise<void> {
  const appUrl = env.appUrl.replace(/\/$/, "");
  const bibliotecaUrl = `${appUrl}/biblioteca-juridica`;

  const subject =
    input.action === "approved"
      ? `[Biblioteca Jurídica] Tu aporte fue publicado: ${input.title}`
      : `[Biblioteca Jurídica] Tu aporte fue rechazado: ${input.title}`;

  const bodyText =
    input.action === "approved"
      ? [
          "¡Buenas noticias! Tu aporte ya está publicado en la Biblioteca Jurídica UNT.",
          "",
          `Título: ${input.title}`,
          "",
          `Ver biblioteca: ${bibliotecaUrl}`,
        ].join("\n")
      : [
          "Tu aporte fue revisado y no pudo publicarse en este momento.",
          "",
          `Título: ${input.title}`,
          input.rejectionReason ? `Motivo: ${input.rejectionReason}` : null,
          "",
          "Puedes revisar el estado en «Mis aportes UNT» dentro de la biblioteca.",
          bibliotecaUrl,
        ]
          .filter(Boolean)
          .join("\n");

  const resendKey = readServerEnv("RESEND_API_KEY");
  const fromEmail =
    readServerEnv("JURISPRUDENCE_NOTIFY_FROM_EMAIL") ??
    "Biblioteca Jurídica <noreply@memoriastudy.local>";

  if (!resendKey) {
    console.info("[jurisprudence/notify-contributor]", subject, bodyText);
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
        to: [input.toEmail],
        subject,
        text: bodyText,
      }),
    });
  } catch (error) {
    console.error("[jurisprudence/notify-contributor] Resend failed:", error);
  }
}
