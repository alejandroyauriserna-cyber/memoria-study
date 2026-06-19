"use client";

import { parseJsonResponse } from "@/lib/api/parse-json-response";
import { renderPdfPagesAsJpeg } from "@/lib/documents/render-pdf-pages-client";

const PAGES_PER_REQUEST = 1;

export async function ocrPdfSlidesClient(
  file: File,
  onProgress?: (message: string) => void,
) {
  onProgress?.("Preparando diapositivas del PDF para lectura con IA…");

  const renderedPages = await renderPdfPagesAsJpeg(file, {
    onProgress: (pageNumber, totalPages) => {
      onProgress?.(`Capturando diapositiva ${pageNumber} de ${totalPages}…`);
    },
  });

  if (!renderedPages.length) {
    throw new Error("El PDF no tiene páginas legibles.");
  }

  const parts: string[] = [];

  for (let index = 0; index < renderedPages.length; index += PAGES_PER_REQUEST) {
    const batch = renderedPages.slice(index, index + PAGES_PER_REQUEST);
    const firstPage = batch[0]?.pageNumber ?? index + 1;
    const lastPage = batch[batch.length - 1]?.pageNumber ?? firstPage;

    onProgress?.(
      batch.length === 1
        ? `Leyendo diapositiva ${firstPage} de ${renderedPages.length} con IA…`
        : `Leyendo diapositivas ${firstPage}–${lastPage} de ${renderedPages.length} con IA…`,
    );

    const response = await fetch("/api/materials/ocr-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        fileName: file.name,
        pages: batch,
      }),
    });

    const payload = await parseJsonResponse<{
      error?: string;
      pages?: Array<{ pageNumber: number; text: string }>;
    }>(response);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Debes iniciar sesión para analizar materiales. Ve a /auth e inténtalo de nuevo.");
      }
      throw new Error(payload.error ?? "No se pudo leer las diapositivas con IA.");
    }

    for (const page of payload.pages ?? []) {
      const trimmed = page.text.trim();
      if (trimmed) {
        parts.push(`--- Diapositiva ${page.pageNumber} ---\n${trimmed}`);
      }
    }
  }

  return parts.join("\n\n").trim();
}
