import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { PDF_OPTIMIZE_THRESHOLD_BYTES } from "@/lib/pdf/server-upload-limits";
import { preparePdfForUpload } from "@/lib/pdf/prepare-pdf-upload";

async function buildTinyPdfFile(): Promise<File> {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const bytes = await pdf.save();
  return new File([Uint8Array.from(bytes)], "test.pdf", { type: "application/pdf" });
}

describe("preparePdfForUpload", () => {
  it("no modifica PDFs pequeños", async () => {
    const file = await buildTinyPdfFile();
    const result = await preparePdfForUpload(file);
    expect(result.optimized).toBe(false);
    expect(result.file.size).toBe(file.size);
  });

  it("intenta optimizar PDFs por encima del umbral", async () => {
    const file = await buildTinyPdfFile();
    Object.defineProperty(file, "size", {
      value: PDF_OPTIMIZE_THRESHOLD_BYTES + 1,
      configurable: true,
    });

    const messages: string[] = [];
    const result = await preparePdfForUpload(file, {
      onProgress: (message) => messages.push(message),
    });

    expect(messages.some((message) => /optimizando/i.test(message))).toBe(true);
    expect(result.file.name).toBe("test.pdf");
  });
});
