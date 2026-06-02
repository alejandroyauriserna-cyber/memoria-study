import { NextResponse } from "next/server";
import {
  OrganizerGenerationError,
  generateOrganizerContent,
} from "@/lib/ai/generate-organizer";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { downloadMaterialPdf } from "@/lib/organizers/download-material-pdf";
import { extractPdfFromBuffer, prepareOrganizerText } from "@/lib/pdf/extract";

export const runtime = "nodejs";
export const maxDuration = 300;

const MIN_EXTRACTED_TEXT = 120;

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
      .select("id,title,file_url,file_name,course_id,course_name,cycle_number,cycle_label")
      .eq("id", materialId)
      .maybeSingle();

    if (materialError) {
      throw materialError;
    }

    if (!materialData?.file_url) {
      return NextResponse.json({ error: "Material no encontrado." }, { status: 404 });
    }

    const { buffer, fileName } = await downloadMaterialPdf(materialData.file_url);

    let extractedText = "";
    let extractionMethod = "unknown";

    try {
      const extraction = await extractPdfFromBuffer(
        buffer,
        materialData.file_name || fileName,
      );
      extractedText = extraction.text;
      extractionMethod = extraction.method;
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

    if (!extractedText || extractedText.trim().length < MIN_EXTRACTED_TEXT) {
      return NextResponse.json(
        {
          error:
            "No se pudo extraer texto suficiente del PDF. Si es escaneado, verifica GEMINI_API_KEY para OCR.",
        },
        { status: 422 },
      );
    }

    const prepared = prepareOrganizerText(extractedText);
    const content = await generateOrganizerContent({
      sourceName: materialData.file_name || fileName,
      text: prepared.text,
      materialTitle: materialData.title,
    });

    const title = `Organizador IA para ${materialData.title}`;
    const description = `Organizador generado a partir del contenido del PDF "${materialData.title}".`;

    const { data: insertedOrganizer, error: insertError } = await admin.from("organizers").insert({
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
    }).select("id").single();

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
      organizer: { id: insertedOrganizer.id, title, description, content },
      extraction: {
        method: extractionMethod,
        truncated: prepared.truncated,
        charCount: prepared.text.length,
      },
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
