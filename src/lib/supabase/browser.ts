"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Missing Supabase browser environment variables.");
  }

  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
