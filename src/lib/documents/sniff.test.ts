import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { sniffStudyDocumentKind } from "@/lib/documents/sniff";

describe("sniffStudyDocumentKind", () => {
  it("detecta pptx por contenido aunque el mime sea zip", async () => {
    const zip = new JSZip();
    zip.file("ppt/presentation.xml", "<p:presentation />");
    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    await expect(sniffStudyDocumentKind(buffer, "archivo.bin", "application/zip")).resolves.toBe(
      "pptx",
    );
  });
});
