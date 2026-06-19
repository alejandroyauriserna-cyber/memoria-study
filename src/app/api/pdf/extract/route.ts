import { requireAuth } from "@/lib/api/require-auth";
import { extractDocumentFromBuffer } from "@/lib/documents/extract";
import {
  detectStudyDocumentKind,
  isLegacyPptFile,
} from "@/lib/documents/kinds";
import { MAX_FILE_SIZE } from "@/lib/pdf/constants";
import { prepareTextForGeneration } from "@/lib/pdf/extract";
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
            message: "Debes subir un PDF o una presentación PowerPoint (.pptx).",
          });
          controller.close();
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          send({
            stage: "error",
            percent: 0,
            message: "El archivo supera el límite de 150 MB.",
          });
          controller.close();
          return;
        }

        if (isLegacyPptFile(file.name, file.type)) {
          send({
            stage: "error",
            percent: 0,
            message:
              "El formato .ppt antiguo no está soportado. Guarda la presentación como .pptx y vuelve a subirla.",
          });
          controller.close();
          return;
        }

        if (!detectStudyDocumentKind(file.name, file.type)) {
          send({
            stage: "error",
            percent: 0,
            message: "Formato no admitido. Usa PDF o PowerPoint (.pptx).",
          });
          controller.close();
          return;
        }

        fileName = file.name;
        console.log("Document extract start:", {
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

        const { text, method } = await extractDocumentFromBuffer(
          buffer,
          file.name,
          {
            forceScanned,
            onProgress: (progress) => send(progress),
          },
        );

        console.log("Document extract success:", {
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
          caught instanceof Error ? caught.message : "Error al leer el archivo.";
        console.error("Document extract failed:", { fileName, error: caught });
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
