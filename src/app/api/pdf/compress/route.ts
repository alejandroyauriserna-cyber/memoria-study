import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/require-auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  compressPdfFromSignedUrl,
  hasPdfCompressService,
} from "@/lib/pdf/compress-pdf-service";
import type { PdfCompressPresetId } from "@/lib/pdf/compress-presets";

export const runtime = "nodejs";
export const maxDuration = 300;

const BUCKET = "pdf-compress-temp";

const bodySchema = z.object({
  storagePath: z.string().min(3),
  preset: z.enum(["recommended", "extreme", "light"]).optional(),
});

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    if (!hasPdfCompressService()) {
      return NextResponse.json(
        {
          error:
            "Compresión profesional en servidor no está activa. Se usará compresión en el navegador.",
        },
        { status: 503 },
      );
    }

    const auth = await requireAuth(request, { rateLimit: { limit: 12, windowMs: 3_600_000 } });
    if (auth instanceof NextResponse) return auth;

    const parsed = bodySchema.parse(await request.json());
    const userPrefix = `${auth.user.id}/`;

    if (!parsed.storagePath.startsWith(userPrefix)) {
      return NextResponse.json({ error: "Ruta de archivo inválida." }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: signed, error: signError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(parsed.storagePath, 300);

    if (signError || !signed?.signedUrl) {
      return NextResponse.json(
        { error: "No se encontró el PDF temporal. Vuelve a seleccionarlo." },
        { status: 404 },
      );
    }

    const preset = (parsed.preset ?? "recommended") as PdfCompressPresetId;
    const compressed = await compressPdfFromSignedUrl(signed.signedUrl, preset);

    const outPath = `${auth.user.id}/compress-out/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(outPath, compressed.bytes, { contentType: "application/pdf", upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: "No se pudo guardar el PDF comprimido." }, { status: 500 });
    }

    const { data: downloadSigned, error: downloadSignError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(outPath, 3600);

    if (downloadSignError || !downloadSigned?.signedUrl) {
      return NextResponse.json({ error: "No se pudo firmar la descarga del PDF." }, { status: 500 });
    }

    void admin.storage.from(BUCKET).remove([parsed.storagePath]);

    return NextResponse.json({
      ok: true,
      storagePath: outPath,
      downloadUrl: downloadSigned.signedUrl,
      originalBytes: compressed.originalBytes,
      compressedBytes: compressed.compressedBytes,
      preset: compressed.preset,
    });
  } catch (caught) {
    if (caught instanceof z.ZodError) {
      return NextResponse.json({ error: "Solicitud de compresión inválida." }, { status: 400 });
    }

    console.error("[api/pdf/compress]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo comprimir el PDF." },
      { status: 500 },
    );
  }
}
