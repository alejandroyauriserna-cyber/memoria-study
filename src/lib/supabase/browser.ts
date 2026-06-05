"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Missing Supabase browser environment variables.");
  }

  // PKCE + cookies (@supabase/ssr): el code verifier queda guardado al pedir
  // recuperación de contraseña; el intercambio del ?code= ocurre en /api/auth/confirm.
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: true,
    },
  });
}
