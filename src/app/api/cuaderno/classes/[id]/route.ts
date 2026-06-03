import { NextResponse } from "next/server";
import { getCuadernoClassForUser, requireCuadernoUser } from "@/lib/cuaderno/auth";
import { recordToCuadernoClass } from "@/lib/cuaderno/mapper";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";
import type { CuadernoClassRecord } from "@/types/cuaderno";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await requireCuadernoUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const cuadernoClass = await getCuadernoClassForUser(id, user.id);
    if (!cuadernoClass) {
      return NextResponse.json({ error: "Clase no encontrada." }, { status: 404 });
    }

    return NextResponse.json({ cuadernoClass });
  } catch (caught) {
    console.error("[cuaderno/class GET]", caught);
    return NextResponse.json({ error: "Error al cargar la clase." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
    }

    const { id } = await context.params;
    const user = await requireCuadernoUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const existing = await getCuadernoClassForUser(id, user.id);
    if (!existing) {
      return NextResponse.json({ error: "Clase no encontrada." }, { status: 404 });
    }

    const body = (await request.json()) as {
      title?: string;
      topic?: string | null;
      classDate?: string | null;
      classNumber?: number | null;
      notes?: string;
      extractedConcepts?: string[];
      materialId?: string | null;
    };

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) patch.title = body.title.trim();
    if (body.topic !== undefined) patch.topic = body.topic?.trim() || null;
    if (body.classDate !== undefined) patch.class_date = body.classDate;
    if (body.classNumber !== undefined) patch.class_number = body.classNumber;
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.extractedConcepts !== undefined) patch.extracted_concepts = body.extractedConcepts;
    if (body.materialId !== undefined) patch.material_id = body.materialId;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("cuaderno_classes")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({
      cuadernoClass: recordToCuadernoClass(data as CuadernoClassRecord),
    });
  } catch (caught) {
    console.error("[cuaderno/class PATCH]", caught);
    return NextResponse.json({ error: "Error al guardar." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await requireCuadernoUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("cuaderno_classes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (caught) {
    console.error("[cuaderno/class DELETE]", caught);
    return NextResponse.json({ error: "Error al eliminar." }, { status: 500 });
  }
}
