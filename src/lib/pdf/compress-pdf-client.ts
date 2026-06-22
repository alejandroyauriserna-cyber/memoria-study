"use client";

import { PDFDocument } from "pdf-lib";
import {
  classifyPdfDocumentProfile,
  pickCompressPresetForProfile,
  shouldAttemptImageCompression,
  type PdfDocumentProfile,
} from "@/lib/pdf/analyze-pdf-profile";
import {
  PDF_COMPRESS_PRESETS,
  PDF_PROFILE_SAMPLE_PAGES,
  type PdfCompressPresetId,
} from "@/lib/pdf/compress-presets";
import { formatCompressionDelta } from "@/lib/pdf/format-bytes";
import { loadPdfJsDocument, readPdfPageText } from "@/lib/pdf/pdfjs-client";
import { PDF_OPTIMIZE_THRESHOLD_BYTES } from "@/lib/pdf/server-upload-limits";
import { shouldUseServerCompression } from "@/lib/pdf/compress-server-limits";
import { compressPdfViaServer } from "@/lib/pdf/compress-pdf-server-client";

export type CompressPdfMethod =
  | "none"
  | "structural"
  | "image"
  | "structural+image"
  | "ghostscript";

export type CompressPdfResult = {
  file: File;
  optimized: boolean;
  originalBytes: number;
  finalBytes: number;
  profile: PdfDocumentProfile;
  presetUsed?: PdfCompressPresetId;
  method: CompressPdfMethod;
};

async function canvasToJpegBytes(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), "image/jpeg", quality);
  });
  if (!blob) {
    throw new Error("No se pudo comprimir una página del PDF.");
  }
  return new Uint8Array(await blob.arrayBuffer());
}

async function structuralCompress(bytes: ArrayBuffer): Promise<Uint8Array | null> {
  try {
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    return await pdf.save({ useObjectStreams: true, addDefaultPage: false });
  } catch {
    return null;
  }
}

async function analyzeProfile(file: File): Promise<PdfDocumentProfile> {
  try {
    const { pdf } = await loadPdfJsDocument(file);
    const pageCount = pdf.numPages;
    const sampleCount = Math.min(pageCount, PDF_PROFILE_SAMPLE_PAGES);
    let sampledTextChars = 0;

    for (let page = 1; page <= sampleCount; page += 1) {
      const text = await readPdfPageText(pdf, page);
      sampledTextChars += text.length;
    }

    return classifyPdfDocumentProfile({
      pageCount,
      sampledPages: sampleCount,
      sampledTextChars,
      fileBytes: file.size,
    });
  } catch (error) {
    console.warn("[compress-pdf-client] profile analysis failed", error);
    return classifyPdfDocumentProfile({
      pageCount: 1,
      sampledPages: 1,
      sampledTextChars: 0,
      fileBytes: file.size,
    });
  }
}

async function compressImageHeavyPdf(input: {
  file: File;
  presetId: PdfCompressPresetId;
  onProgress?: (message: string) => void;
}): Promise<Uint8Array> {
  const preset = PDF_COMPRESS_PRESETS[input.presetId];
  const buffer = await input.file.arrayBuffer();
  const { pdf } = await loadPdfJsDocument(buffer);
  const out = await PDFDocument.create();
  const total = pdf.numPages;

  for (let pageNumber = 1; pageNumber <= total; pageNumber += 1) {
    input.onProgress?.(`Comprimiendo página ${pageNumber} de ${total}…`);

    const page = await pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: preset.renderScale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      throw new Error("No se pudo preparar la compresión del PDF.");
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      background: "#ffffff",
    }).promise;

    const jpegBytes = await canvasToJpegBytes(canvas, preset.jpegQuality);
    const image = await out.embedJpg(jpegBytes);
    const pdfPage = out.addPage([baseViewport.width, baseViewport.height]);
    pdfPage.drawImage(image, {
      x: 0,
      y: 0,
      width: baseViewport.width,
      height: baseViewport.height,
    });

    canvas.width = 0;
    canvas.height = 0;

    if (pageNumber % 2 === 0) {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 0);
      });
    }
  }

  return out.save({ useObjectStreams: true });
}

function toPdfFile(bytes: Uint8Array, fileName: string): File {
  return new File([Uint8Array.from(bytes)], fileName, { type: "application/pdf" });
}

export async function compressPdfForUpload(
  file: File,
  options?: { onProgress?: (message: string) => void; minBytes?: number },
): Promise<CompressPdfResult> {
  const originalBytes = file.size;
  const minBytes = options?.minBytes ?? PDF_OPTIMIZE_THRESHOLD_BYTES;

  const emptyProfile: PdfDocumentProfile = {
    pageCount: 1,
    sampledPages: 1,
    sampledTextChars: 0,
    bytesPerPage: originalBytes,
    kind: "mixed",
  };

  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    return {
      file,
      optimized: false,
      originalBytes,
      finalBytes: originalBytes,
      profile: emptyProfile,
      method: "none",
    };
  }

  if (originalBytes < 512 * 1024) {
    return {
      file,
      optimized: false,
      originalBytes,
      finalBytes: originalBytes,
      profile: emptyProfile,
      method: "none",
    };
  }

  options?.onProgress?.("Analizando PDF…");
  const profile = await analyzeProfile(file);
  const presetId = pickCompressPresetForProfile(profile, originalBytes);

  if (shouldUseServerCompression(profile.pageCount, originalBytes, profile.kind)) {
    try {
      options?.onProgress?.("PDF grande — comprimiendo en servidor (Ghostscript)…");
      const serverFile = await Promise.race([
        compressPdfViaServer(file, {
          preset: presetId,
          onProgress: options?.onProgress,
        }),
        new Promise<File>((_, reject) => {
          window.setTimeout(
            () => reject(new Error("Tiempo de espera agotado en compresión del servidor.")),
            120_000,
          );
        }),
      ]);

      if (serverFile.size < originalBytes) {
        options?.onProgress?.(
          `PDF listo: ${formatCompressionDelta(originalBytes, serverFile.size)}`,
        );
        return {
          file: serverFile,
          optimized: true,
          originalBytes,
          finalBytes: serverFile.size,
          profile,
          presetUsed: presetId,
          method: "ghostscript",
        };
      }
    } catch (error) {
      console.warn("[compress-pdf-client] server compress unavailable, using browser", error);
      options?.onProgress?.("Servidor ocupado — comprimiendo en tu navegador…");
    }
  }

  let bestBytes: Uint8Array | null = null;
  let method: CompressPdfMethod = "none";
  let presetUsed: PdfCompressPresetId | undefined;

  const buffer = await file.arrayBuffer();

  if (profile.kind === "text" || PDF_COMPRESS_PRESETS[presetId].structuralFirst) {
    options?.onProgress?.("Optimizando estructura del PDF…");
    const structural = await structuralCompress(buffer);
    if (structural && structural.length < originalBytes) {
      bestBytes = structural;
      method = "structural";
    }
  }

  const candidateFile = bestBytes ? toPdfFile(bestBytes, file.name) : file;
  const shouldImage = shouldAttemptImageCompression(profile, candidateFile.size, minBytes);

  if (shouldImage) {
    options?.onProgress?.(
      profile.kind === "scanned"
        ? "PDF escaneado — comprimiendo como iLovePDF (modo recomendado)…"
        : "Comprimiendo imágenes del PDF…",
    );

    try {
      let imageBytes = await compressImageHeavyPdf({
        file: candidateFile,
        presetId,
        onProgress: options?.onProgress,
      });
      presetUsed = presetId;

      if (
        imageBytes.length > (bestBytes?.length ?? originalBytes) * 0.92 &&
        presetId !== "extreme" &&
        originalBytes > 10 * 1024 * 1024
      ) {
        options?.onProgress?.("Aplicando compresión extrema…");
        const extremeBytes = await compressImageHeavyPdf({
          file: candidateFile,
          presetId: "extreme",
          onProgress: options?.onProgress,
        });
        if (extremeBytes.length < imageBytes.length) {
          imageBytes = extremeBytes;
          presetUsed = "extreme";
        }
      }

      if (!bestBytes || imageBytes.length < bestBytes.length) {
        bestBytes = imageBytes;
        method = method === "structural" ? "structural+image" : "image";
      }
    } catch (error) {
      console.warn("[compress-pdf-client]", error);
    }
  }

  if (!bestBytes || bestBytes.length >= originalBytes) {
    return {
      file,
      optimized: false,
      originalBytes,
      finalBytes: originalBytes,
      profile,
      method: "none",
    };
  }

  const optimizedFile = toPdfFile(bestBytes, file.name);
  options?.onProgress?.(`PDF listo: ${formatCompressionDelta(originalBytes, optimizedFile.size)}`);

  return {
    file: optimizedFile,
    optimized: true,
    originalBytes,
    finalBytes: optimizedFile.size,
    profile,
    presetUsed,
    method,
  };
}
