import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export async function createClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot always set cookies; middleware refreshes sessions.
        }
      },
    },
  });
}
