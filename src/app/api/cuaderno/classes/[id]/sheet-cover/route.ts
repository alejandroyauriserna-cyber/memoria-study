import { NextResponse } from "next/server";
import { generateSheetCoverArt } from "@/lib/ai/generate-cuaderno-cover";
import { getCuadernoClassForUser, requireCuadernoUser } from "@/lib/cuaderno/auth";
import { parseNoteContent, serializeNoteContent } from "@/lib/cuaderno/note-meta";
import { recordToCuadernoClass } from "@/lib/cuaderno/mapper";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";
import type { CuadernoClassRecord } from "@/types/cuaderno";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
    }

    const { id } = await context.params;
    const user = await requireCuadernoUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const cuadernoClass = await getCuadernoClassForUser(id, user.id);
    if (!cuadernoClass) {
      return NextResponse.json({ error: "Clase no encontrada." }, { status: 404 });
    }

    const { meta, body } = parseNoteContent(cuadernoClass.notes);
    const sheetCover = await generateSheetCoverArt({
      courseName: cuadernoClass.courseName,
      classTitle: cuadernoClass.title,
      topic: cuadernoClass.topic,
      notesPreview: body,
    });

    const notes = serializeNoteContent({ ...meta, sheetCover }, body);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("cuaderno_classes")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({
      sheetCover,
      notes,
      cuadernoClass: recordToCuadernoClass(data as CuadernoClassRecord),
    });
  } catch (caught) {
    console.error("[cuaderno/sheet-cover]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al generar mini portada." },
      { status: 500 },
    );
  }
}
