/**
 * Genera iconos PNG para PWA desde public/icon.svg
 * Uso: node scripts/generate-pwa-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const svgPath = path.join(root, "public", "icon.svg");
const outDir = path.join(root, "public", "icons");

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Instala sharp: npm install --save-dev sharp");
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const svg = fs.readFileSync(svgPath);

  const sizes = [
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "icon-512-maskable.png", size: 512, maskable: true },
  ];

  for (const { name, size, maskable } of sizes) {
    let pipeline = sharp(svg).resize(size, size, { fit: "contain", background: "#07131A" });

    if (maskable) {
      const padded = Math.round(size * 0.8);
      pipeline = sharp(svg)
        .resize(padded, padded, { fit: "contain", background: "#07131A" })
        .extend({
          top: Math.round((size - padded) / 2),
          bottom: Math.round((size - padded) / 2),
          left: Math.round((size - padded) / 2),
          right: Math.round((size - padded) / 2),
          background: "#07131A",
        });
    }

    await pipeline.png({ compressionLevel: 9 }).toFile(path.join(outDir, name));
    console.log(`✓ public/icons/${name}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
