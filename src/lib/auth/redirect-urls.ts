/** URLs permitidas en Supabase: /auth, /auth/callback y / (inicio unificado) */
export function authPageUrl(mode?: string): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const url = new URL("/auth", origin);
  if (mode) {
    url.searchParams.set("mode", mode);
  }
  return url.toString();
}

/** Enlace de retorno tras confirmar correo — debe coincidir con Supabase Redirect URLs. */
export function authCallbackUrl(): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return new URL("/auth/callback", origin).toString();
}
