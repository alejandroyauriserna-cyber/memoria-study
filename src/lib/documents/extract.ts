import {
  detectStudyDocumentKind,
  isLegacyPptFile,
} from "@/lib/documents/kinds";
import {
  extractPdfFromBuffer,
  type PdfExtractionMeta,
  type PdfExtractionOptions,
} from "@/lib/pdf/extract";
import { extractPptxFromBuffer } from "@/lib/pptx/extract";

export type DocumentExtractionMethod = PdfExtractionMeta["method"] | "pptx";

export async function extractDocumentFromBuffer(
  buffer: Buffer,
  fileName: string,
  options: PdfExtractionOptions = {},
): Promise<{ text: string; method: DocumentExtractionMethod }> {
  if (isLegacyPptFile(fileName)) {
    throw new Error(
      "El formato .ppt antiguo no está soportado. En PowerPoint usa «Guardar como» → .pptx y vuelve a subir el archivo.",
    );
  }

  const kind = detectStudyDocumentKind(fileName);

  if (!kind) {
    throw new Error("Formato no admitido. Usa PDF o PowerPoint (.pptx).");
  }

  if (kind === "pptx") {
    options.onProgress?.({
      stage: "parse",
      percent: 20,
      message: "Leyendo diapositivas y notas del presentador...",
    });

    const text = await extractPptxFromBuffer(buffer);

    options.onProgress?.({
      stage: "parse",
      percent: 70,
      message: "Presentación leída correctamente.",
    });

    return { text, method: "pptx" };
  }

  return extractPdfFromBuffer(buffer, fileName, options);
}

export async function extractDocumentText(
  file: File,
  options: PdfExtractionOptions = {},
) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return extractDocumentFromBuffer(buffer, file.name, options);
}
