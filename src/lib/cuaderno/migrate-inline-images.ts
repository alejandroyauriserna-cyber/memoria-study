import { createFloatingImage } from "@/lib/cuaderno/floating-image";
import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";

/**
 * Extrae imágenes incrustadas del HTML del editor y las convierte en objetos flotantes.
 */
export function migrateInlineImagesFromHtml(html: string): {
  html: string;
  images: DecorationObject[];
} {
  if (!html.trim() || typeof DOMParser === "undefined") {
    return { html, images: [] };
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const images: DecorationObject[] = [];
  let index = 0;

  doc.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src");
    if (!src) {
      img.remove();
      return;
    }
    const w = Number(img.getAttribute("width")) || undefined;
    const h = Number(img.getAttribute("height")) || undefined;
    const natural = w && h ? { w, h } : undefined;
    images.push(
      createFloatingImage(
        src,
        { x: 0.08 + index * 0.06, y: 0.1 + index * 0.05 },
        natural,
      ),
    );
    img.remove();
    index += 1;
  });

  doc.querySelectorAll(".cn-image-block-view").forEach((el) => el.remove());
  doc.querySelectorAll("p").forEach((p) => {
    if (!p.textContent?.trim() && !p.querySelector("*")) p.remove();
  });

  const cleaned = doc.body.innerHTML.trim() || "<p></p>";
  return { html: cleaned, images };
}
