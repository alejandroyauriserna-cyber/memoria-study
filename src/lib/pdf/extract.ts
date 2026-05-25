import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function extractPdfText(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("PDFs hasta 100 MB.");
  }

  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    disableWorker: true,
  } as any);

  const pdf = await loadingTask.promise;

  let text = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);

    const content = await page.getTextContent();

    const strings = content.items
      .map((item: any) =>
        "str" in item ? item.str : ""
      )
      .join(" ");

    text += strings + "\n";
  }

  return text;
}