import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { PDF_OPTIMIZE_THRESHOLD_BYTES } from "@/lib/pdf/server-upload-limits";

async function buildTinyPdfFile(): Promise<File> {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const bytes = await pdf.save();
  return new File([Uint8Array.from(bytes)], "test.pdf", { type: "application/pdf" });
}

describe("preparePdfForUpload threshold", () => {
  it("no intenta comprimir PDFs muy pequeños por debajo del umbral de peso", async () => {
    const file = await buildTinyPdfFile();
    expect(file.size).toBeLessThan(PDF_OPTIMIZE_THRESHOLD_BYTES);
  });
});
