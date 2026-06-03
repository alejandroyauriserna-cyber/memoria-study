#!/usr/bin/env node
/**
 * Valida migraciones de stickers sin tocar Supabase remoto.
 * node scripts/audit-sticker-migration.mjs
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(name) {
  return readFileSync(join(root, "supabase/migrations", name), "utf8");
}

const rls = read("20260605_cuaderno_stickers_rls_favorites.sql");
const storage = read("20260605_cuaderno_stickers_storage.sql");
const obsolete = read("20260604_cuaderno_user_stickers.sql");

const errors = [];
const ok = [];

if (/create\s+table\s+.*cuaderno_user_stickers/i.test(rls)) {
  errors.push("RLS migration must NOT CREATE cuaderno_user_stickers");
} else {
  ok.push("No CREATE cuaderno_user_stickers in RLS migration");
}

if (!/user_sticker_favorites/i.test(rls)) {
  errors.push("Missing user_sticker_favorites table");
} else {
  ok.push("user_sticker_favorites defined");
}

for (const cmd of ["select", "insert", "update", "delete"]) {
  const re = new RegExp(`cuaderno_user_stickers_${cmd}_own`, "i");
  if (!re.test(rls) && !new RegExp(`for ${cmd}`, "i").test(rls)) {
    errors.push(`Missing RLS policy hint for ${cmd.toUpperCase()}`);
  }
}
ok.push("RLS policies present (select/insert/update/delete)");

if (!/enable row level security/i.test(rls)) {
  errors.push("RLS not enabled on cuaderno_user_stickers");
}

if (!/cuaderno-stickers/.test(storage)) {
  errors.push("Storage migration missing bucket id");
} else {
  ok.push("Storage bucket cuaderno-stickers configured");
}

if (/public\s*=\s*true/i.test(storage)) {
  errors.push("Bucket should be private (public = false)");
} else {
  ok.push("Bucket marked private");
}

if (/create\s+table/i.test(obsolete)) {
  errors.push("20260604 migration must be OBSOLETE (no CREATE TABLE)");
} else if (!/OBSOLETO/i.test(obsolete)) {
  errors.push("20260604 migration should contain OBSOLETO marker");
} else {
  ok.push("20260604 marked obsolete (safe)");
}

console.log("\n=== Audit: Sticker migrations ===\n");
ok.forEach((m) => console.log("  OK:", m));
if (errors.length) {
  console.error("\n  FAILURES:");
  errors.forEach((e) => console.error("   -", e));
  process.exit(1);
}
console.log("\nAll migration checks passed.\n");
