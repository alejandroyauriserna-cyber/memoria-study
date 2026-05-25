export async function extractPdfText(file: File) {
  if (file.type !== "application/pdf") {
    throw new Error("Please upload a PDF file.");
  }

  if (file.size > 12 * 1024 * 1024) {
    throw new Error("PDFs are limited to 12 MB for this MVP.");
  }

  const [{ getDocument, GlobalWorkerOptions }, { join }, { pathToFileURL }] =
    await Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("node:path"),
      import("node:url"),
    ]);

  GlobalWorkerOptions.workerSrc = pathToFileURL(
    join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"),
  ).href;

  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: new Uint8Array(buffer), useWorkerFetch: false }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (text) {
      pages.push(text);
    }
  }

  const extracted = pages.join("\n\n").slice(0, 90_000);

  if (extracted.length < 250) {
    throw new Error("The PDF did not contain enough selectable text to study.");
  }

  return extracted;
}
