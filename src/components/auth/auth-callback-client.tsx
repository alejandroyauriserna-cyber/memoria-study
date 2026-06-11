"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { humanizeAuthError, isPkceVerifierError } from "@/lib/auth/humanize-auth-error";
import {
  buildAuthConfirmUrl,
  hasImplicitSessionHash,
  needsServerAuthConfirm,
  parseAuthUrl,
} from "@/lib/auth/parse-auth-params";

export function AuthCallbackClient() {
  const router = useRouter();
  const [message, setMessage] = useState("Completando acceso…");

  useEffect(() => {
    async function finishCallback() {
      const params = parseAuthUrl();

      if (params.authError) {
        router.replace(`/auth?auth_error=${encodeURIComponent(humanizeAuthError(params.authError))}`);
        return;
      }

      if (hasImplicitSessionHash(params)) {
        const accessToken = params.hash.get("access_token");
        const refreshToken = params.hash.get("refresh_token");

        if (accessToken && refreshToken) {
          const supabase = createClient();
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            router.replace(
              `/auth?auth_error=${encodeURIComponent(humanizeAuthError(error.message))}`,
            );
            return;
          }

          router.replace("/");
          return;
        }
      }

      if (params.code) {
        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(params.code);

        if (!error) {
          router.replace("/");
          return;
        }

        if (isPkceVerifierError(error.message)) {
          router.replace(
            `/auth?auth_error=${encodeURIComponent(humanizeAuthError(error.message))}&email=${encodeURIComponent(params.email ?? "")}`,
          );
          return;
        }
      }

      if (needsServerAuthConfirm(params)) {
        window.location.replace(buildAuthConfirmUrl(params));
        return;
      }

      router.replace("/auth");
    }

    void finishCallback().catch(() => {
      setMessage("No se pudo completar el acceso. Redirigiendo…");
      router.replace("/auth");
    });
  }, [router]);

  return <p className="text-sm text-muted-foreground">{message}</p>;
}
