import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

function loadEnv() {
  const raw = readFileSync(".env.local", "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const tables = ["cuaderno_favorites", "cuaderno_ai_items", "cuaderno_course_covers"];

for (const table of tables) {
  const { error } = await supabase.from(table).select("user_id").limit(1);
  console.log(table, error ? `MISSING (${error.code})` : "OK");
}
