"use client";

import { parseJsonResponse } from "@/lib/api/parse-json-response";
import type { PdfCompressPresetId } from "@/lib/pdf/compress-presets";
import { uploadPdfToCompressTemp } from "@/lib/pdf/upload-compress-temp-client";

export async function compressPdfViaServer(
  file: File,
  options?: {
    preset?: PdfCompressPresetId;
    onProgress?: (message: string) => void;
  },
): Promise<File> {
  options?.onProgress?.("Subiendo PDF al compresor profesional…");
  const { storagePath } = await uploadPdfToCompressTemp(file);

  options?.onProgress?.("Comprimiendo con Ghostscript (servidor)…");

  const response = await fetch("/api/pdf/compress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      storagePath,
      preset: options?.preset ?? "recommended",
    }),
  });

  const payload = await parseJsonResponse<{
    error?: string;
    downloadUrl?: string;
    compressedBytes?: number;
    originalBytes?: number;
  }>(response);

  if (!response.ok) {
    throw new Error(payload.error ?? "No se pudo comprimir el PDF en el servidor.");
  }

  if (!payload.downloadUrl) {
    throw new Error("El servidor no devolvió el PDF comprimido.");
  }

  options?.onProgress?.("Descargando PDF optimizado…");
  const downloadResponse = await fetch(payload.downloadUrl);
  if (!downloadResponse.ok) {
    throw new Error("No se pudo descargar el PDF comprimido.");
  }

  const blob = await downloadResponse.blob();
  return new File([blob], file.name, { type: "application/pdf" });
}
