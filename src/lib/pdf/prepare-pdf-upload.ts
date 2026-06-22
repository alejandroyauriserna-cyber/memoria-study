"use client";

import type { PdfDocumentProfile } from "@/lib/pdf/analyze-pdf-profile";
import type { PdfCompressPresetId } from "@/lib/pdf/compress-presets";
import type { CompressPdfMethod } from "@/lib/pdf/compress-pdf-client";
import { compressPdfForUpload } from "@/lib/pdf/compress-pdf-client";
import { PDF_OPTIMIZE_THRESHOLD_BYTES } from "@/lib/pdf/server-upload-limits";

export type PreparedPdfUpload = {
  file: File;
  optimized: boolean;
  originalBytes: number;
  finalBytes: number;
  profile?: PdfDocumentProfile;
  presetUsed?: PdfCompressPresetId;
  method?: CompressPdfMethod;
};

export async function preparePdfForUpload(
  file: File,
  options?: { onProgress?: (message: string) => void },
): Promise<PreparedPdfUpload> {
  const result = await compressPdfForUpload(file, {
    onProgress: options?.onProgress,
    minBytes: PDF_OPTIMIZE_THRESHOLD_BYTES,
  });

  return {
    file: result.file,
    optimized: result.optimized,
    originalBytes: result.originalBytes,
    finalBytes: result.finalBytes,
    profile: result.profile,
    presetUsed: result.presetUsed,
    method: result.method,
  };
}
