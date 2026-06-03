import { NextResponse } from "next/server";
import { generateOrganizerContent } from "@/lib/ai/generate-organizer";
import { getCuadernoClassForUser, requireCuadernoUser } from "@/lib/cuaderno/auth";
import { buildCuadernoStudyContext, loadCuadernoPdfContext } from "@/lib/cuaderno/context";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

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

    if (!cuadernoClass.notes.trim()) {
      return NextResponse.json(
        { error: "Escribe apuntes antes de generar un organizador." },
        { status: 400 },
      );
    }

    const pdfText = await loadCuadernoPdfContext(cuadernoClass.materialId);
    const studyContext = buildCuadernoStudyContext(cuadernoClass, pdfText);

    const content = await generateOrganizerContent({
      sourceName: `Cuaderno: ${cuadernoClass.title}`,
      text: studyContext,
      materialTitle: cuadernoClass.topic || cuadernoClass.title,
    });

    const title = cuadernoClass.topic
      ? `${cuadernoClass.topic} — ${cuadernoClass.courseName}`
      : `${cuadernoClass.title} — ${cuadernoClass.courseName}`;

    const admin = createAdminClient();
    const { data: inserted, error } = await admin
      .from("organizers")
      .insert({
        user_id: user.id,
        material_id: cuadernoClass.materialId,
        title,
        description: `Generado desde Cuaderno Inteligente · ${cuadernoClass.title}`,
        course_id: cuadernoClass.courseId,
        course_name: cuadernoClass.courseName,
        cycle_number: cuadernoClass.cycleNumber,
        cycle_label: cuadernoClass.cycleLabel,
        organizer_type: "resumen",
        content,
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({
      organizerId: inserted.id,
      redirectUrl: `/organizers?created=${inserted.id}`,
    });
  } catch (caught) {
    console.error("[cuaderno/generate-organizer]", caught);
    return NextResponse.json(
      {
        error:
          caught instanceof Error
            ? caught.message
            : "No se pudo generar el organizador desde los apuntes.",
      },
      { status: 500 },
    );
  }
}
