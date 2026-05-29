"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { AppShell } from "@/components/ui/shell";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verificando tu ingreso...");
  const router = useRouter();

  useEffect(() => {
    async function handleAuthCallback() {
      const params = new URLSearchParams(window.location.search);
      const type = params.get("type");
      const token = params.get("token");
      const code = params.get("code");
      const email = params.get("email");
      const redirectAfter = `${window.location.origin}/dashboard`;

      try {
        const supabase = createClient();

        let response;
        // Case A: explicit OTP token (magic link / email confirm)
        if (token && type) {
          response = await supabase.auth.verifyOtp({
            type: type as any,
            token,
            email: email ?? "",
          });

        // Case B: try to obtain session from URL fragment (recommended)
        } else {
          // Try to parse session from URL first (handles implicit flow and hash tokens)
          try {
            const sessionResp = await (supabase.auth as any).getSessionFromUrl();
            response = sessionResp;
          } catch (err) {
            // If getSessionFromUrl fails but we have a code param, try exchanging it.
            if (code) {
              try {
                response = await supabase.auth.exchangeCodeForSession(code);
              } catch (ex) {
                // If PKCE verifier missing, try getSessionFromUrl as fallback one more time.
                const msg = ex instanceof Error ? ex.message : String(ex);
                if (/pkce|code verifier/i.test(msg)) {
                  try {
                    const fallback = await (supabase.auth as any).getSessionFromUrl();
                    response = fallback;
                  } catch {
                    throw ex;
                  }
                } else {
                  throw ex;
                }
              }
            } else {
              throw new Error(
                "No se encontró el token de autorización. Vuelve a iniciar sesión.",
              );
            }
          }
        }

        if (response.error) {
          throw response.error;
        }

        setStatus("success");
        router.replace(redirectAfter);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "No se pudo completar la autenticación.",
        );
      }
    }

    void handleAuthCallback();
  }, [router]);

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight">Confirmando tu correo</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{message}</p>
          {status === "error" ? (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Si el enlace ya expiró, vuelve a iniciar sesión para recibir uno nuevo.
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
