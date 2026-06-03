import { NextResponse } from "next/server";
import { generateCourseCoverArt } from "@/lib/ai/generate-cuaderno-cover";
import { requireCuadernoUser } from "@/lib/cuaderno/auth";
import { saveCourseCoverForUser } from "@/lib/cuaderno/collections-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ courseId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
    }

    const { courseId } = await context.params;
    const user = await requireCuadernoUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const body = (await request.json()) as { courseName?: string; cycleLabel?: string };
    const courseName = body.courseName?.trim() || courseId;

    const admin = createAdminClient();
    const { data: classRows } = await admin
      .from("cuaderno_classes")
      .select("title")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .order("updated_at", { ascending: false })
      .limit(12);

    const coverArt = await generateCourseCoverArt({
      courseId,
      courseName,
      cycleLabel: body.cycleLabel,
      classTitles: (classRows ?? []).map((r) => r.title as string),
    });

    await saveCourseCoverForUser(user.id, courseId, coverArt, "ai");

    return NextResponse.json({ coverArt });
  } catch (caught) {
    console.error("[cuaderno/course/cover]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al generar portada." },
      { status: 500 },
    );
  }
}
