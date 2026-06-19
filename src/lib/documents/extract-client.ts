"use client";

import {
  detectStudyDocumentKind,
  isLegacyPptFile,
} from "@/lib/documents/kinds";

const MAX_PDF_PAGES = 60;
const MIN_USEFUL_TEXT = 80;

function configurePdfWorker(pdfjs: typeof import("pdfjs-dist")) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
}

async function extractPdfTextClient(file: File) {
  const pdfjs = await import("pdfjs-dist");
  configurePdfWorker(pdfjs);

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pageLimit = Math.min(pdf.numPages, MAX_PDF_PAGES);
  const parts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText) {
      parts.push(`--- Página ${pageNumber} ---\n${pageText}`);
    }
  }

  return parts.join("\n\n").trim();
}

function pptConvertedPdfHint(fileName: string) {
  if (!/\.pdf$/i.test(fileName)) return null;
  return (
    "Este PDF parece exportado desde PowerPoint y no tiene texto seleccionable (solo imágenes). " +
    "Sube el archivo .pptx original en lugar del PDF convertido."
  );
}

export async function extractStudyDocumentTextClient(file: File) {
  if (isLegacyPptFile(file.name, file.type)) {
    throw new Error(
      "El formato .ppt antiguo no está soportado. Guarda la presentación como .pptx en PowerPoint.",
    );
  }

  const kind = detectStudyDocumentKind(file.name, file.type);
  if (!kind) {
    throw new Error("Formato no admitido. Usa PDF o PowerPoint (.pptx).");
  }

  if (kind === "pptx") {
    const { extractPptxFromBuffer } = await import("@/lib/pptx/extract");
    const text = await extractPptxFromBuffer(await file.arrayBuffer());
    return { text, method: "pptx-client" as const };
  }

  const text = await extractPdfTextClient(file);
  if (text.length < MIN_USEFUL_TEXT) {
    const pptHint = pptConvertedPdfHint(file.name);
    throw new Error(
      pptHint ??
        "No se extrajo suficiente texto del PDF. Si es escaneado o solo imágenes, usa un PDF con texto seleccionable o el .pptx original.",
    );
  }

  return { text, method: "pdfjs-client" as const };
}
