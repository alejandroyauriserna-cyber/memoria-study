const MIN_PDF_BYTES = 512;

export async function downloadMaterialPdf(fileUrl: string) {
  const response = await fetch(fileUrl, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`No se pudo descargar el PDF del material (HTTP ${response.status}).`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.byteLength < MIN_PDF_BYTES) {
    throw new Error("El archivo PDF descargado está vacío o es inválido.");
  }

  const fileName = decodeURIComponent(new URL(fileUrl).pathname.split("/").pop() ?? "material.pdf");

  return { buffer, fileName };
}
