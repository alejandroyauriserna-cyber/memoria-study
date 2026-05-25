import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function createAdminClient() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error("Missing Supabase service role environment variables.");
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey);
}
