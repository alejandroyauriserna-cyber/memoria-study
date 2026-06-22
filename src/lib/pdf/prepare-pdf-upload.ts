"use client";

import { PDFDocument } from "pdf-lib";
import { PDF_OPTIMIZE_THRESHOLD_BYTES } from "@/lib/pdf/server-upload-limits";

export type PreparedPdfUpload = {
  file: File;
  optimized: boolean;
  originalBytes: number;
  finalBytes: number;
};

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function preparePdfForUpload(
  file: File,
  options?: { onProgress?: (message: string) => void },
): Promise<PreparedPdfUpload> {
  const originalBytes = file.size;

  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    return { file, optimized: false, originalBytes, finalBytes: originalBytes };
  }

  if (originalBytes < PDF_OPTIMIZE_THRESHOLD_BYTES) {
    return { file, optimized: false, originalBytes, finalBytes: originalBytes };
  }

  options?.onProgress?.("Optimizando PDF para que suba más rápido…");

  try {
    const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    const bytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
    const optimized = new File([Uint8Array.from(bytes)], file.name, { type: "application/pdf" });

    if (optimized.size < originalBytes) {
      options?.onProgress?.(
        `PDF optimizado: ${formatMb(originalBytes)} → ${formatMb(optimized.size)}`,
      );
      return {
        file: optimized,
        optimized: true,
        originalBytes,
        finalBytes: optimized.size,
      };
    }
  } catch {
    // PDF cifrado o no compatible: se sube el original vía Storage directo.
  }

  return { file, optimized: false, originalBytes, finalBytes: originalBytes };
}
