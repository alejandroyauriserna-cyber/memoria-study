import { NextResponse } from "next/server";
import { extractCuadernoConcepts } from "@/lib/ai/extract-cuaderno-concepts";
import { getCuadernoClassForUser, requireCuadernoUser } from "@/lib/cuaderno/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 120;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
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

    const concepts = await extractCuadernoConcepts(
      cuadernoClass.notes,
      cuadernoClass.courseName,
    );

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("cuaderno_classes")
      .update({
        extracted_concepts: concepts,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ concepts, cuadernoClass: data });
  } catch (caught) {
    console.error("[cuaderno/extract-concepts]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al extraer conceptos." },
      { status: 500 },
    );
  }
}
