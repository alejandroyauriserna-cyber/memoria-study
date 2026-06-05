"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createClient } from "@/lib/supabase/browser";
import {
  buildAuthConfirmUrl,
  hasImplicitSessionHash,
  hasRecoverySignal,
  needsServerAuthConfirm,
  parseAuthUrl,
} from "@/lib/auth/parse-auth-params";

type EntryView = "loading" | "reset-password" | "form";

async function waitForSession(maxAttempts = 12): Promise<boolean> {
  const supabase = createClient();
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) return true;
    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }
  return false;
}

export function AuthEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<EntryView>("loading");
  const [callbackError, setCallbackError] = useState("");

  useEffect(() => {
    async function resolveEntry() {
      const params = parseAuthUrl();

      if (params.authError) {
        setCallbackError(params.authError);
        setView("form");
        window.history.replaceState({}, "", "/auth");
        return;
      }

      if (needsServerAuthConfirm(params)) {
        window.location.replace(buildAuthConfirmUrl(params));
        return;
      }

      if (hasImplicitSessionHash(params)) {
        try {
          const hasSession = await waitForSession();
          if (!hasSession) {
            throw new Error("El enlace de acceso no es válido o expiró.");
          }

          if (hasRecoverySignal(params)) {
            window.history.replaceState({}, "", "/auth?mode=reset-password");
            setView("reset-password");
            return;
          }

          router.replace("/");
          return;
        } catch (error) {
          setCallbackError(
            error instanceof Error
              ? error.message
              : "No se pudo completar la autenticación.",
          );
          setView("form");
          return;
        }
      }

      if (params.search.get("mode") === "reset-password") {
        try {
          const hasSession = await waitForSession(4);
          setView(hasSession ? "reset-password" : "form");
          if (!hasSession) {
            setCallbackError(
              "Abre el enlace del correo en el mismo navegador donde pediste recuperar la contraseña, o solicita un enlace nuevo.",
            );
          }
          return;
        } catch (error) {
          setCallbackError(
            error instanceof Error
              ? error.message
              : "No se pudo validar la sesión de recuperación.",
          );
          setView("form");
          return;
        }
      }

      setView(hasRecoverySignal(params) ? "reset-password" : "form");
    }

    void resolveEntry();
  }, [router, searchParams]);

  if (view === "loading") {
    return <p className="text-sm text-muted-foreground">Cargando acceso…</p>;
  }

  if (view === "reset-password") {
    return <ResetPasswordForm />;
  }

  return (
    <>
      {callbackError ? (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {callbackError}
        </p>
      ) : null}
      <AuthForm />
    </>
  );
}
