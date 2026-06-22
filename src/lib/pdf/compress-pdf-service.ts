import { readServerEnv } from "@/lib/env/runtime";
import type { PdfCompressPresetId } from "@/lib/pdf/compress-presets";

export function hasPdfCompressService(): boolean {
  return Boolean(
    readServerEnv("PDF_COMPRESS_SERVICE_URL")?.trim() &&
      readServerEnv("PDF_COMPRESS_SERVICE_SECRET")?.trim(),
  );
}

export async function compressPdfFromSignedUrl(
  sourceUrl: string,
  preset: PdfCompressPresetId = "recommended",
) {
  const baseUrl = readServerEnv("PDF_COMPRESS_SERVICE_URL")?.trim().replace(/\/$/, "");
  const secret = readServerEnv("PDF_COMPRESS_SERVICE_SECRET")?.trim();

  if (!baseUrl || !secret) {
    throw new Error("Servicio de compresión PDF no configurado.");
  }

  const response = await fetch(`${baseUrl}/compress`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sourceUrl, preset }),
  });

  if (!response.ok) {
    let message = `Compress service ${response.status}`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      const text = await response.text().catch(() => "");
      if (text) message = text.slice(0, 300);
    }
    throw new Error(message);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.byteLength) {
    throw new Error("El servicio devolvió un PDF vacío.");
  }

  return {
    bytes,
    originalBytes: Number(response.headers.get("x-original-bytes") ?? 0),
    compressedBytes: Number(response.headers.get("x-compressed-bytes") ?? bytes.byteLength),
    preset: (response.headers.get("x-compress-preset") as PdfCompressPresetId | null) ?? preset,
  };
}
