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

async function testTable(name, insert, cleanup) {
  const { data, error } = await supabase.from(name).insert(insert).select().single();
  if (error) {
    console.log(`${name}: insert probe failed — ${error.message}`);
    return false;
  }
  await cleanup(data);
  console.log(`${name}: OK (schema + write)`);
  return true;
}

// Probe con usuario/clase ficticia — solo validamos que columnas existen
const fav = await supabase.from("cuaderno_favorites").select("user_id, class_id, created_at").limit(0);
console.log("cuaderno_favorites columns:", fav.error ? fav.error.message : "ok");

const items = await supabase
  .from("cuaderno_ai_items")
  .select("id, user_id, kind, class_id, course_name, class_title, title, content, created_at")
  .limit(0);
console.log("cuaderno_ai_items columns:", items.error ? items.error.message : "ok");

const covers = await supabase
  .from("cuaderno_course_covers")
  .select("user_id, course_id, cover_art, source, updated_at")
  .limit(0);
console.log("cuaderno_course_covers columns:", covers.error ? covers.error.message : "ok");

// Conteo
for (const t of ["cuaderno_favorites", "cuaderno_ai_items", "cuaderno_course_covers"]) {
  const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
  console.log(`${t} rows:`, error ? error.message : count ?? 0);
}
