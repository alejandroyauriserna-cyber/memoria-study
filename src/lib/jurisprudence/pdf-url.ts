const PLACEHOLDER_PDF_PATTERNS = [
  /conDetalleJurisprudencia\.xhtml$/i,
  /sunat\.gob\.pe\/legislacion\/jurisprudencia\/?$/i,
  /tc\.gob\.pe\/jurisprudencia\/?$/i,
  /osce\.gob\.pe\/consultas\/informacion\/jurisprudencia\/?$/i,
];

export function hasUsableJurisprudencePdfUrl(pdfUrl: string | null | undefined): boolean {
  const url = pdfUrl?.trim();
  if (!url) return false;
  if (PLACEHOLDER_PDF_PATTERNS.some((pattern) => pattern.test(url))) return false;
  return url.startsWith("http://") || url.startsWith("https://");
}
