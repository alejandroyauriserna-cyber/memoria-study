import { NextResponse } from "next/server";
import { z } from "zod";
import { GUIDED_STUDY_ANALYSIS_VERSION } from "@/lib/guided-study/analysis-version";
import { verifyMaterialAccess } from "@/lib/materials/verify-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

const upsertSchema = z.object({
  materialId: z.string().uuid(),
  currentPage: z.number().int().positive(),
  understoodPages: z.array(z.number().int().positive()).default([]),
  analysisVersion: z.number().int().positive().optional(),
});

export async function GET(request: Request) {
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

    const materialId = new URL(request.url).searchParams.get("materialId");
    if (!materialId) {
      return NextResponse.json({ error: "Falta materialId." }, { status: 400 });
    }

    const access = await verifyMaterialAccess(materialId, user.id);
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("guided_study_sessions")
      .select("current_page,understood_pages,analysis_version,last_updated")
      .eq("user_id", user.id)
      .eq("material_id", materialId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({
        session: null,
        currentAnalysisVersion: GUIDED_STUDY_ANALYSIS_VERSION,
      });
    }

    return NextResponse.json({
      session: {
        materialId,
        currentPage: data.current_page,
        understoodPages: data.understood_pages ?? [],
        analysisVersion: data.analysis_version ?? 1,
        lastUpdated: data.last_updated,
      },
      currentAnalysisVersion: GUIDED_STUDY_ANALYSIS_VERSION,
    });
  } catch (error) {
    console.error("[guided-study/progress GET]", error);
    return NextResponse.json({ error: "No se pudo cargar el progreso." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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

    const body = upsertSchema.parse(await request.json());
    const access = await verifyMaterialAccess(body.materialId, user.id);
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("guided_study_sessions")
      .upsert(
        {
          user_id: user.id,
          material_id: body.materialId,
          current_page: body.currentPage,
          understood_pages: [...new Set(body.understoodPages)].sort((a, b) => a - b),
          analysis_version: body.analysisVersion ?? GUIDED_STUDY_ANALYSIS_VERSION,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "user_id,material_id" },
      )
      .select("current_page,understood_pages,analysis_version,last_updated")
      .single();

    if (error) throw error;

    return NextResponse.json({
      session: {
        materialId: body.materialId,
        currentPage: data.current_page,
        understoodPages: data.understood_pages ?? [],
        analysisVersion: data.analysis_version ?? GUIDED_STUDY_ANALYSIS_VERSION,
        lastUpdated: data.last_updated,
      },
    });
  } catch (error) {
    console.error("[guided-study/progress PUT]", error);
    return NextResponse.json({ error: "No se pudo guardar el progreso." }, { status: 500 });
  }
}
