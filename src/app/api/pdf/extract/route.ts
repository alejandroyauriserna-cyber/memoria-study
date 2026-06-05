import { requireAuth } from "@/lib/api/require-auth";
import { MAX_FILE_SIZE } from "@/lib/pdf/constants";
import { extractPdfFromBuffer, prepareTextForGeneration } from "@/lib/pdf/extract";
import type { PdfExtractStreamEvent } from "@/types/pdf-progress";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

function streamLine(event: PdfExtractStreamEvent) {
  return `${JSON.stringify(event)}\n`;
}

export async function POST(request: Request) {
  const auth = await requireAuth(request, { rateLimit: { limit: 15, windowMs: 60_000 } });
  if (auth instanceof NextResponse) return auth;

  const encoder = new TextEncoder();
  let fileName = "desconocido";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: PdfExtractStreamEvent) => {
        controller.enqueue(encoder.encode(streamLine(event)));
      };

      try {
        const formData = await request.formData();
        const file = formData.get("file");
        const forceScanned = formData.get("forceScanned") === "true";

        if (!(file instanceof File)) {
          send({
            stage: "error",
            percent: 0,
            message: "Debes subir un PDF.",
          });
          controller.close();
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          send({
            stage: "error",
            percent: 0,
            message: "El PDF supera el límite de 150 MB.",
          });
          controller.close();
          return;
        }

        fileName = file.name;
        console.log("PDF extract start:", {
          fileName,
          size: file.size,
          mimeType: file.type,
          forceScanned,
        });

        send({
          stage: "upload",
          percent: 5,
          message: `Recibido: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
        });

        const buffer = Buffer.from(await file.arrayBuffer());

        const { text, method } = await extractPdfFromBuffer(
          buffer,
          file.name,
          {
            forceScanned,
            onProgress: (progress) => send(progress),
          },
        );

        console.log("PDF extract success:", {
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          method,
          textChars: text.length,
          forceScanned,
        });

        const prepared = prepareTextForGeneration(text);

        send({
          stage: "done",
          percent: 100,
          message: prepared.truncated
            ? `Lectura completa (${method}). Texto recortado para la IA por tamaño.`
            : `Lectura completa (${method}).`,
          text: prepared.text,
          method,
          charCount: prepared.text.length,
          truncated: prepared.truncated,
        });
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "Error al leer el PDF.";
        console.error("PDF extract failed:", { fileName, error: caught });
        send({
          stage: "error",
          percent: 0,
          message,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
