import { NextResponse } from "next/server";
import { OrganizerGenerationError } from "@/lib/ai/generate-organizer";
import { generateOrganizerFromMaterial } from "@/lib/organizers/generate-from-material";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 300;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

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
    const { data: organizer, error: organizerError } = await admin
      .from("organizers")
      .select("id,user_id,material_id")
      .eq("id", id)
      .maybeSingle();

    if (organizerError) throw organizerError;

    if (!organizer) {
      return NextResponse.json({ error: "Organizador no encontrado." }, { status: 404 });
    }

    if (organizer.user_id !== user.id) {
      return NextResponse.json({ error: "No tienes permiso para regenerar este organizador." }, { status: 403 });
    }

    if (!organizer.material_id) {
      return NextResponse.json(
        { error: "Este organizador no tiene un material asociado para regenerar." },
        { status: 422 },
      );
    }

    const { data: material, error: materialError } = await admin
      .from("materials")
      .select("id,title,file_url,file_name,course_id,course_name,cycle_number,cycle_label")
      .eq("id", organizer.material_id)
      .maybeSingle();

    if (materialError) throw materialError;

    if (!material?.file_url) {
      return NextResponse.json({ error: "Material no encontrado." }, { status: 404 });
    }

    let generated;

    try {
      generated = await generateOrganizerFromMaterial(material);
    } catch (extractionError) {
      return NextResponse.json(
        {
          error:
            extractionError instanceof Error
              ? extractionError.message
              : "No se pudo procesar el PDF.",
        },
        { status: 422 },
      );
    }

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await admin
      .from("organizers")
      .update({
        title: generated.title,
        description: generated.description,
        content: generated.content,
        updated_at: now,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      organizer: updated,
      extraction: generated.extraction,
    });
  } catch (caught) {
    if (caught instanceof OrganizerGenerationError) {
      return NextResponse.json({ error: caught.userMessage }, { status: 503 });
    }

    console.error("[organizers/regenerate]", caught);

    return NextResponse.json(
      { error: "Ocurrió un error al regenerar el organizador. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
