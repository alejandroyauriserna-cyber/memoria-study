import { getVisualAiFormat } from "@/lib/organizers/visual-ai-formats";
import type { VisualAiFormatId } from "@/lib/organizers/visual-ai-types";

export function diagramExportDimensions(formatId: VisualAiFormatId) {
  const format = getVisualAiFormat(formatId);
  if (format.aspectRatio === "16:9") return { width: 1440, height: 820 };
  if (format.aspectRatio === "4:3") return { width: 1200, height: 900 };
  return { width: 1200, height: 1200 };
}

export async function rasterizeSvgToPng(
  svgText: string,
  width: number,
  height: number,
  scale = 2,
): Promise<Blob> {
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }));
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("No se pudo rasterizar el diagrama."));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible.");

    ctx.scale(scale, scale);
    ctx.fillStyle = "#f0faff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo exportar PNG retina."))),
        "image/png",
        1,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadSvgFile(svgText: string, filename: string) {
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".svg") ? filename : `${filename}.svg`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function printDiagramAsPdf(svgText: string, title: string) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");
  if (!printWindow) throw new Error("Permite ventanas emergentes para exportar PDF.");

  printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${title}</title>
<style>
  @page { size: landscape; margin: 12mm; }
  body { margin: 0; background: #f0faff; display: grid; place-items: center; min-height: 100vh; }
  svg { width: 100%; max-width: 100%; height: auto; }
</style></head><body>${svgText}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
}

export async function fetchSvgText(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("No se pudo cargar el diagrama.");
  return response.text();
}
