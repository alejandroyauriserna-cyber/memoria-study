/** Usar Ghostscript en servidor si el PDF es grande o tiene muchas páginas. */
export const PDF_SERVER_COMPRESS_MIN_BYTES = 6 * 1024 * 1024;
export const PDF_SERVER_COMPRESS_HEAVY_BYTES = 12 * 1024 * 1024;
export const PDF_SERVER_COMPRESS_MIN_PAGES = 55;

export function shouldUseServerCompression(
  pageCount: number,
  fileBytes: number,
  kind: "text" | "mixed" | "scanned",
): boolean {
  if (pageCount >= PDF_SERVER_COMPRESS_MIN_PAGES && fileBytes >= 2 * 1024 * 1024) {
    return true;
  }
  if (fileBytes < PDF_SERVER_COMPRESS_MIN_BYTES) return false;
  if (fileBytes >= PDF_SERVER_COMPRESS_HEAVY_BYTES) return true;
  if (kind === "scanned" && fileBytes >= PDF_SERVER_COMPRESS_MIN_BYTES) return true;
  return false;
}
