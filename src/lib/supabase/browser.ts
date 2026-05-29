"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Missing Supabase browser environment variables.");
  }

  // Use implicit flow + detectSessionInUrl in browser clients for email
  // confirmation links so that session exchange doesn't rely on a PKCE
  // code verifier stored in localStorage/cookies (which breaks when the
  // link is opened on another device or after clearing storage).
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: true,
    },
  });
}
