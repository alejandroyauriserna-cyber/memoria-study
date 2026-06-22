"use client";

export async function loadPdfJsDocument(file: File | ArrayBuffer) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const data = file instanceof File ? await file.arrayBuffer() : file;
  const pdf = await pdfjs.getDocument({ data }).promise;
  return { pdfjs, pdf };
}

export async function readPdfPageText(
  pdf: Awaited<ReturnType<typeof loadPdfJsDocument>>["pdf"],
  pageNumber: number,
): Promise<string> {
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();
  return content.items
    .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
