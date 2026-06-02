import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export const runtime = "nodejs";

function buildOrganizerContent(material: any) {
  return {
    summary: `Resumen del material: ${material.description}`,
    flashcards: [
      { question: `¿Cuál es el tema principal de ${material.title}?`, answer: material.description },
    ],
    reviewQuestions: [
      `¿Qué puntos clave se deben recordar de ${material.course_name}?`,
      `¿Cómo se aplica el contenido de este material en casos prácticos?`,
    ],
    conceptMap: {
      title: material.title,
      nodes: [material.course_name, material.cycle_label, "conceptos clave"],
    },
    synopticChart: {
      title: material.title,
      highlights: [material.course_name, material.cycle_label],
    },
    comparisonTable: {
      left: "Concepto",
      right: "Definición",
    },
    hierarchy: {
      root: material.course_name,
      branches: [material.title],
    },
    flowChart: {
      start: "Leer material",
      end: "Aplicar en estudio",
    },
    timeline: {
      events: [
        { date: new Date(material.created_at).toLocaleDateString("es-PE"), label: "Creación" },
      ],
    },
    simplifiedExplanation: `Este material ayuda a entender ${material.course_name} en ${material.cycle_label}.`, 
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const materialId = url.searchParams.get("materialId");

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
      .select("*")
      .eq("id", materialId)
      .maybeSingle();

    if (materialError) {
      throw materialError;
    }

    if (!materialData) {
      return NextResponse.json({ error: "Material no encontrado." }, { status: 404 });
    }

    const content = buildOrganizerContent(materialData);
    const title = `Organizador IA para ${materialData.title}`;
    const description = `Organizador generado automáticamente para el material "${materialData.title}".`;

    const { error: insertError } = await admin.from("organizers").insert({
      user_id: user.id,
      material_id: materialId,
      title,
      description,
      course_id: materialData.course_id,
      course_name: materialData.course_name,
      cycle_number: materialData.cycle_number,
      cycle_label: materialData.cycle_label,
      organizer_type: "resumen",
      content,
    });

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

    return NextResponse.json({ organizer: { title, description, content } });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error generando organizador." },
      { status: 500 },
    );
  }
}
