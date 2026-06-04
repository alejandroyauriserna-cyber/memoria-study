import { NextResponse } from "next/server";
import { analyzeDocumentForStudy } from "@/lib/guided-study/legal-tutor";
import { loadMaterialForGuidedStudy } from "@/lib/guided-study/load-material";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const body = (await request.json()) as { materialId?: string };
    if (!body.materialId) {
      return NextResponse.json({ error: "Falta materialId." }, { status: 400 });
    }

    const material = await loadMaterialForGuidedStudy(body.materialId);
    const index = await analyzeDocumentForStudy({
      title: material.title,
      pages: material.pages,
    });

    return NextResponse.json({
      material: {
        id: material.id,
        title: material.title,
        fileName: material.fileName,
        fileUrl: material.fileUrl,
        courseName: material.courseName,
        cycleLabel: material.cycleLabel,
        totalPages: material.pages.length,
      },
      index,
    });
  } catch (caught) {
    console.error("[guided-study/analyze]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al analizar documento." },
      { status: 500 },
    );
  }
}
