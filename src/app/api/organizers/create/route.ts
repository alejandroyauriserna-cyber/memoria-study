import { NextResponse } from "next/server";
import {
  OrganizerGenerationError,
} from "@/lib/ai/generate-organizer";
import { normalizeAcademicFromRecord } from "@/lib/academic/helpers";
import { generateOrganizerFromMaterial } from "@/lib/organizers/generate-from-material";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const materialId = url.searchParams.get("materialId");
    const organizerType = url.searchParams.get("type") ?? "resumen";
    const allowedTypes = new Set([
      "resumen",
      "flashcards",
      "preguntas",
      "mapa-conceptual",
      "cuadro-sinoptico",
      "cuadro-comparativo",
      "jerarquico",
      "flujo",
      "linea-del-tiempo",
      "explicacion",
    ]);
    const resolvedType = allowedTypes.has(organizerType) ? organizerType : "resumen";

    if (!materialId) {
      return NextResponse.json({ error: "MaterialId requerido." }, { status: 400 });
    }

    if (!env.supabaseUrl || !env.supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: materialData, error: materialError } = await admin
      .from("materials")
      .select("id,title,file_url,file_name,course_id,course_name,cycle_number,cycle_label")
      .eq("id", materialId)
      .maybeSingle();

    if (materialError) {
      throw materialError;
    }

    if (!materialData?.file_url) {
      return NextResponse.json({ error: "Material no encontrado." }, { status: 404 });
    }

    const academic = normalizeAcademicFromRecord(materialData);
    if (!academic) {
      return NextResponse.json(
        {
          error:
            "El material tiene un curso no válido según la malla UNT 2021. Actualiza el curso del material antes de generar el organizador.",
        },
        { status: 422 },
      );
    }

    let generated;

    try {
      generated = await generateOrganizerFromMaterial(materialData);
    } catch (extractionError) {
      return NextResponse.json(
        {
          error:
            extractionError instanceof Error
              ? extractionError.message
              : "No se pudo leer el PDF del material.",
        },
        { status: 422 },
      );
    }

    const { data: insertedOrganizer, error: insertError } = await admin
      .from("organizers")
      .insert({
        user_id: user.id,
        material_id: materialId,
        title: generated.title,
        description: generated.description,
        course_id: academic.courseId,
        course_name: academic.courseName,
        cycle_number: academic.cycleNumber,
        cycle_label: academic.cycleLabel,
        organizer_type: resolvedType,
        content: generated.content,
      })
      .select("id")
      .single();

    if (insertError) {
      throw insertError;
    }

    const { data: profileData, error: profileSelectError } = await admin
      .from("user_profiles")
      .select("total_organizers, reputation_points")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profileSelectError) {
      if (profileData) {
        await admin
          .from("user_profiles")
          .update({
            total_organizers: (profileData.total_organizers ?? 0) + 1,
            reputation_points: (profileData.reputation_points ?? 0) + 15,
          })
          .eq("user_id", user.id);
      } else {
        await admin.from("user_profiles").insert({
          user_id: user.id,
          email: user.email,
          academic_context: {},
          total_organizers: 1,
          reputation_points: 15,
        });
      }
    }

    return NextResponse.json({
      organizer: {
        id: insertedOrganizer.id,
        title: generated.title,
        description: generated.description,
        content: generated.content,
      },
      extraction: generated.extraction,
    });
  } catch (caught) {
    if (caught instanceof OrganizerGenerationError) {
      return NextResponse.json({ error: caught.userMessage }, { status: 503 });
    }

    console.error("[organizers/create]", caught);

    return NextResponse.json(
      { error: "Ocurrió un error al generar el organizador. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
