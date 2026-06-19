import JSZip from "jszip";
import {
  detectStudyDocumentKind,
  type StudyDocumentKind,
} from "@/lib/documents/kinds";

function normalizeZipPath(path: string) {
  return path.replace(/\\/g, "/");
}

export async function sniffStudyDocumentKind(
  buffer: Buffer,
  fileName: string,
  mimeType?: string,
): Promise<StudyDocumentKind | null> {
  const byMeta = detectStudyDocumentKind(fileName, mimeType);
  if (byMeta) return byMeta;

  if (buffer.byteLength >= 4 && buffer.subarray(0, 4).toString("utf8") === "%PDF") {
    return "pdf";
  }

  if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const isPptx = Object.keys(zip.files).some((path) =>
        /ppt\/presentation\.xml$/i.test(normalizeZipPath(path)),
      );
      if (isPptx) return "pptx";
    } catch {
      // not a readable zip archive
    }
  }

  return null;
}
