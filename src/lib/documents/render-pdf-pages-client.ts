"use client";

const DEFAULT_MAX_PAGES = 40;
const DEFAULT_SCALE = 2;
const JPEG_QUALITY = 0.82;

function configurePdfWorker(pdfjs: typeof import("pdfjs-dist")) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
}

function canvasToJpegBase64(canvas: HTMLCanvasElement) {
  return new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo convertir la diapositiva a imagen."));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result !== "string") {
            reject(new Error("No se pudo leer la imagen de la diapositiva."));
            return;
          }

          const comma = result.indexOf(",");
          resolve(comma >= 0 ? result.slice(comma + 1) : result);
        };
        reader.onerror = () => reject(new Error("No se pudo leer la imagen de la diapositiva."));
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

export type RenderedPdfPage = {
  pageNumber: number;
  imageBase64: string;
};

export async function renderPdfPagesAsJpeg(
  file: File,
  options?: {
    maxPages?: number;
    scale?: number;
    onProgress?: (pageNumber: number, totalPages: number) => void;
  },
): Promise<RenderedPdfPage[]> {
  const pdfjs = await import("pdfjs-dist");
  configurePdfWorker(pdfjs);

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pageLimit = Math.min(pdf.numPages, options?.maxPages ?? DEFAULT_MAX_PAGES);
  const scale = options?.scale ?? DEFAULT_SCALE;
  const pages: RenderedPdfPage[] = [];

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    options?.onProgress?.(pageNumber, pageLimit);

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Tu navegador no puede renderizar el PDF para OCR.");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    const imageBase64 = await canvasToJpegBase64(canvas);
    pages.push({ pageNumber, imageBase64 });
  }

  return pages;
}
