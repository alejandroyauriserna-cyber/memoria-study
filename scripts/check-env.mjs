#!/usr/bin/env node
/**
 * Valida .env.local (Biblioteca Jurídica y Supabase mínimos).
 * Uso: node scripts/check-env.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env.local");

function parseEnvFile(content) {
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    const hash = value.indexOf(" #");
    if (hash !== -1) value = value.slice(0, hash).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

if (!existsSync(envPath)) {
  console.error("❌ No existe .env.local — copia .env.example y completa tus valores.");
  process.exit(1);
}

const env = parseEnvFile(readFileSync(envPath, "utf8"));
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const jurisprudence = [
  "JURISPRUDENCE_UNT_EMAIL_DOMAINS",
  "JURISPRUDENCE_MODERATOR_EMAILS",
];

let ok = true;

for (const key of required) {
  if (!env[key]?.trim()) {
    console.error(`❌ Falta ${key} en .env.local`);
    ok = false;
  }
}

for (const key of jurisprudence) {
  if (!env[key]?.trim()) {
    console.warn(`⚠️  Falta ${key} — moderación/aportes UNT pueden fallar`);
  }
}

const moderators = (env.JURISPRUDENCE_MODERATOR_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

if (moderators.some((e) => e.includes("tu-correo") || e.includes("your_"))) {
  console.error(
    "❌ JURISPRUDENCE_MODERATOR_EMAILS sigue con el placeholder — pon tu correo real en .env.local",
  );
  ok = false;
}

if (moderators.length) {
  console.log(`✅ Moderadores configurados (${moderators.length}):`);
  for (const email of moderators) {
    console.log(`   · ${email}`);
  }
} else {
  console.warn("⚠️  Sin moderadores — en local (dev) cualquier usuario autenticado puede moderar");
}

if (env.RESEND_API_KEY?.includes("#")) {
  console.warn("⚠️  RESEND_API_KEY tiene un comentario inline — quítalo (comentarios en línea aparte)");
}

console.log("\n📌 .env.example es solo plantilla (sin claves reales). Tus valores van en .env.local.");
console.log("📌 En Vercel: Settings → Environment Variables → mismo JURISPRUDENCE_MODERATOR_EMAILS → Redeploy.\n");

process.exit(ok ? 0 : 1);
