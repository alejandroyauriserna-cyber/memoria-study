"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createClient } from "@/lib/supabase/browser";

type EntryView = "loading" | "reset-password" | "form";

function hasRecoverySignal(search: URLSearchParams, hash: URLSearchParams): boolean {
  const type = search.get("type") ?? hash.get("type");
  return type === "recovery" || search.get("mode") === "reset-password";
}

function hasAuthCallbackSignal(search: URLSearchParams, hash: URLSearchParams): boolean {
  return Boolean(
    search.get("code") ||
      search.get("token") ||
      hash.get("access_token") ||
      hash.get("refresh_token"),
  );
}

export function AuthEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<EntryView>("loading");
  const [callbackError, setCallbackError] = useState("");

  useEffect(() => {
    async function resolveEntry() {
      const search = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      if (!hasAuthCallbackSignal(search, hash)) {
        setView(hasRecoverySignal(search, hash) ? "reset-password" : "form");
        return;
      }

      try {
        const supabase = createClient();
        const type = search.get("type") ?? hash.get("type");
        const token = search.get("token");
        const code = search.get("code");
        const email = search.get("email");

        let response;

        if (token && type) {
          response = await supabase.auth.verifyOtp({
            type: type as "signup" | "recovery" | "email" | "magiclink",
            token,
            email: email ?? "",
          });
        } else if (code) {
          response = await supabase.auth.exchangeCodeForSession(code);
        } else if (hash.get("access_token")) {
          const { data, error } = await supabase.auth.getSession();
          response = { data, error };
        } else {
          throw new Error("Enlace de acceso inválido o expirado.");
        }

        if (response.error) {
          throw response.error;
        }

        if (hasRecoverySignal(search, hash)) {
          window.history.replaceState({}, "", "/auth?mode=reset-password");
          setView("reset-password");
          return;
        }

        router.replace("/dashboard");
      } catch (error) {
        setCallbackError(
          error instanceof Error
            ? error.message
            : "No se pudo completar la autenticación.",
        );
        setView("form");
      }
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
