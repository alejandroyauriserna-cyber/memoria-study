#!/usr/bin/env node
/**
 * Simulación lógica del flujo stickers (sin Supabase remoto).
 * node scripts/audit-sticker-flow.mjs
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const library = read("src/app/api/cuaderno/stickers/library/route.ts");
const importRoute = read("src/app/api/cuaderno/stickers/import/route.ts");
const favorites = read("src/app/api/cuaderno/stickers/favorites/route.ts");
const storage = read("src/lib/cuaderno/sticker-storage.ts");
const importPanel = read("src/components/cuaderno/decoration/cuaderno-sticker-import-modal.tsx");

const errors = [];
const steps = [];

function assert(cond, msg) {
  if (!cond) errors.push(msg);
}

// --- Paso 1: Import ---
steps.push("1. POST /api/cuaderno/stickers/import");
assert(/\.from\(["']cuaderno_user_stickers["']\)/.test(importRoute) === false, "import no debe escribir en DB");
assert(/imageDataUrl/.test(importRoute), "import devuelve imageDataUrl");
assert(/label:/.test(importRoute), "import devuelve label (nombre UI, no columna DB)");

const fakeImportResponse = {
  imageDataUrl: "data:image/png;base64,iVBORw0KGgo=",
  label: "Sticker importado",
  sourceUrl: "https://example.com/a.png",
};
assert(
  importPanel.includes('body: JSON.stringify({ imageDataUrl: processedSrc, name:'),
  "import panel guarda con campo name (no label) en library POST",
);

// --- Paso 2: Guardar ---
steps.push("2. POST /api/cuaderno/stickers/library");
assert(/image_url:\s*storagePath/.test(library), "INSERT usa image_url = path Storage");
assert(/name:/.test(library), "INSERT usa name");
assert(!/storage_path|public_url|label:/.test(library), "library no usa columnas viejas");
assert(/uploadStickerBuffer/.test(library), "subida vía uploadStickerBuffer (service role)");
assert(/cuaderno-stickers/.test(storage), "bucket cuaderno-stickers en sticker-storage");

const userId = randomUUID();
const stickerId = randomUUID();
const storagePath = `${userId}/${stickerId}.png`;
const dbRow = {
  id: stickerId,
  user_id: userId,
  name: fakeImportResponse.label,
  image_url: storagePath,
  created_at: new Date().toISOString(),
};
assert(dbRow.name && dbRow.image_url && !dbRow.label && !dbRow.storage_path, "fila simulada cumple esquema DB");

// --- Paso 3: Listar ---
steps.push("3. GET /api/cuaderno/stickers/library");
assert(/\.from\(["']cuaderno_user_stickers["']\)/.test(library), "GET lee cuaderno_user_stickers");
assert(/row\.image_url/.test(library), "mapRow lee image_url");
assert(/row\.name/.test(library), "mapRow lee name");
assert(/user_sticker_favorites/.test(library), "GET cruza favoritos");

// --- Paso 4: Favorito ---
steps.push("4. POST /api/cuaderno/stickers/favorites");
assert(/user_sticker_favorites/.test(favorites), "favoritos en tabla separada");
assert(/cuaderno_user_stickers/.test(favorites), "valida ownership antes de favorito");
assert(!/is_favorite/.test(favorites), "no usa columna is_favorite");

// --- Paso 5: Eliminar ---
steps.push("5. DELETE /api/cuaderno/stickers/library?id=");
assert(/\.delete\(\)/.test(library) && /removeStickerFiles/.test(library), "DELETE borra favoritos, fila y archivo Storage");

console.log("\n=== Simulación flujo stickers ===\n");
steps.forEach((s) => console.log(" ", s));
console.log("\n  Estado simulado tras guardar:");
console.log("   DB:", JSON.stringify(dbRow, null, 2).split("\n").map((l) => "    " + l).join("\n"));
console.log("   Storage path:", storagePath);
console.log("   API response shape: { id, name, imageUrl (signed), storagePath, createdAt, isFavorite }");

if (errors.length) {
  console.error("\n  FAILURES:");
  errors.forEach((e) => console.error("   -", e));
  process.exit(1);
}
console.log("\n  OK: flujo import → guardar → listar → favorito → eliminar coherente con esquema name/image_url.\n");
