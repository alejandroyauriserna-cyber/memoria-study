import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { getPackExport, STICKER_MARKETPLACE } from "../src/lib/cuaderno/sticker-catalog";

const outDir = join(process.cwd(), "public", "cuaderno", "sticker-packs");
mkdirSync(outDir, { recursive: true });

for (const pack of STICKER_MARKETPLACE) {
  const data = getPackExport(pack.id);
  if (!data) continue;
  writeFileSync(
    join(outDir, `${pack.id}.json`),
    JSON.stringify({ version: 1, pack: data.pack, count: data.count, stickers: data.stickers }, null, 2),
    "utf8",
  );
  console.log(`${pack.id}.json — ${data.count} stickers`);
}

writeFileSync(
  join(outDir, "index.json"),
  JSON.stringify({
    version: 1,
    packs: STICKER_MARKETPLACE.map((p) => ({
      id: p.id,
      label: p.label,
      emoji: p.emoji,
      file: `/cuaderno/sticker-packs/${p.id}.json`,
    })),
  }, null, 2),
  "utf8",
);

console.log("Packs estáticos generados en public/cuaderno/sticker-packs/");
