"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createClient } from "@/lib/supabase/browser";
import { humanizeAuthError, isPkceVerifierError } from "@/lib/auth/humanize-auth-error";
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

async function establishSessionFromHash(params: ReturnType<typeof parseAuthUrl>): Promise<void> {
  const accessToken = params.hash.get("access_token");
  const refreshToken = params.hash.get("refresh_token");

  if (!accessToken || !refreshToken) {
    const hasSession = await waitForSession();
    if (!hasSession) {
      throw new Error("El enlace de acceso no es válido o expiró.");
    }
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) throw error;
}

async function exchangeAuthCodeClientFirst(params: ReturnType<typeof parseAuthUrl>): Promise<boolean> {
  if (!params.code) return false;

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(params.code);

  if (!error) return true;

  if (isPkceVerifierError(error.message)) {
    throw new Error(error.message);
  }

  return false;
}

export function AuthEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<EntryView>("loading");
  const [callbackError, setCallbackError] = useState("");
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState("");

  useEffect(() => {
    async function resolveEntry() {
      const params = parseAuthUrl();

      if (params.authError) {
        setCallbackError(humanizeAuthError(params.authError));
        setPendingConfirmEmail(params.email ?? params.search.get("email") ?? "");
        setView("form");
        window.history.replaceState({}, "", "/auth");
        return;
      }

      if (params.code) {
        try {
          const exchanged = await exchangeAuthCodeClientFirst(params);
          if (exchanged) {
            window.history.replaceState({}, "", "/");
            router.replace("/");
            return;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (isPkceVerifierError(message)) {
            setCallbackError(humanizeAuthError(message));
            setPendingConfirmEmail(params.email ?? "");
            setView("form");
            window.history.replaceState({}, "", "/auth");
            return;
          }
        }
      }

      if (needsServerAuthConfirm(params)) {
        window.location.replace(buildAuthConfirmUrl(params));
        return;
      }

      if (hasImplicitSessionHash(params)) {
        try {
          await establishSessionFromHash(params);

          if (hasRecoverySignal(params)) {
            window.history.replaceState({}, "", "/auth?mode=reset-password");
            setView("reset-password");
            return;
          }

          window.history.replaceState({}, "", "/");
          router.replace("/");
          return;
        } catch (error) {
          setCallbackError(
            humanizeAuthError(
              error instanceof Error
                ? error.message
                : "No se pudo completar la autenticación.",
            ),
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
            humanizeAuthError(
              error instanceof Error
                ? error.message
                : "No se pudo validar la sesión de recuperación.",
            ),
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
        <p className="auth-error">{callbackError}</p>
      ) : null}
      <AuthForm pendingConfirmEmail={pendingConfirmEmail} />
    </>
  );
}
