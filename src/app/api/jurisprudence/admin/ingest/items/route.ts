import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isJurisprudenceMateria,
  isJurisprudenceTipo,
} from "@/lib/jurisprudence/build-document-id";
import { requireJurisprudenceModerator } from "@/lib/jurisprudence/require-moderator";

export const runtime = "nodejs";

const patchSchema = z.object({
  title: z.string().min(3).optional(),
  tipo: z.string().optional(),
  materia: z.string().optional(),
  submateria: z.string().optional(),
  year: z.number().int().optional(),
  organo: z.string().optional(),
  summary: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  expediente: z.string().optional(),
  sala: z.string().optional(),
  distritoJudicial: z.string().optional(),
  asuntoPrincipal: z.string().optional(),
});

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("reprocess"),
    itemIds: z.array(z.string().uuid()).min(1),
  }),
  z.object({
    action: z.literal("patch"),
    itemIds: z.array(z.string().uuid()).min(1),
    patch: patchSchema,
  }),
]);

export async function POST(request: Request) {
  try {
    const auth = await requireJurisprudenceModerator();
    if (auth instanceof NextResponse) return auth;

    const body = bodySchema.parse(await request.json());
    const admin = createAdminClient();

    if (body.action === "reprocess") {
      await admin
        .from("jurisprudence_ingest_items")
        .update({ status: "queued", error_message: null, duplicate_of: null })
        .in("id", body.itemIds);

      return NextResponse.json({ requeued: body.itemIds.length });
    }

    const { data: items } = await admin
      .from("jurisprudence_ingest_items")
      .select("id, suggested")
      .in("id", body.itemIds);

    let updated = 0;
    for (const item of items ?? []) {
      const current = (item.suggested as Record<string, unknown>) ?? {};
      const next = { ...current, ...body.patch };

      if (body.patch.tipo && !isJurisprudenceTipo(body.patch.tipo)) continue;
      if (body.patch.materia && !isJurisprudenceMateria(body.patch.materia)) continue;

      const { error } = await admin
        .from("jurisprudence_ingest_items")
        .update({ suggested: next })
        .eq("id", item.id);

      if (!error) updated += 1;
    }

    return NextResponse.json({ updated });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error en edición masiva." },
      { status: 500 },
    );
  }
}
