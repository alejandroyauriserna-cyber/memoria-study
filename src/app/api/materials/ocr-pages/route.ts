import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/require-auth";
import { hasSupabaseEnv } from "@/lib/env";
import { ocrSlideImageWithGemini } from "@/lib/pdf/gemini-ocr";

export const runtime = "nodejs";
export const maxDuration = 120;

const pageSchema = z.object({
  pageNumber: z.number().int().positive(),
  imageBase64: z.string().min(32),
});

const bodySchema = z.object({
  fileName: z.string().min(1),
  pages: z.array(pageSchema).min(1).max(3),
});

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const auth = await requireAuth(request, { rateLimit: { limit: 80, windowMs: 3_600_000 } });
    if (auth instanceof NextResponse) return auth;

    const { fileName, pages } = bodySchema.parse(await request.json());
    const parts: Array<{ pageNumber: number; text: string }> = [];

    for (const page of pages) {
      const buffer = Buffer.from(page.imageBase64, "base64");
      const text = await ocrSlideImageWithGemini(
        buffer,
        `${fileName} · diapositiva ${page.pageNumber}`,
      );
      parts.push({ pageNumber: page.pageNumber, text });
    }

    return NextResponse.json({ ok: true, pages: parts });
  } catch (caught) {
    if (caught instanceof z.ZodError) {
      return NextResponse.json({ error: "Solicitud de OCR inválida." }, { status: 400 });
    }

    console.error("[materials/ocr-pages]", caught);
    return NextResponse.json(
      {
        error:
          caught instanceof Error
            ? caught.message
            : "No se pudo leer las diapositivas con OCR.",
      },
      { status: 500 },
    );
  }
}
