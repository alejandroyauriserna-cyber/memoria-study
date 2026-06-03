import { NextResponse } from "next/server";
import { loadCourseCoversForUser } from "@/lib/cuaderno/collections-server";
import { mergeCourseCoverMaps } from "@/lib/cuaderno/course-covers";
import { requireCuadernoUser } from "@/lib/cuaderno/auth";
import { hasSupabaseEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
    }

    const user = await requireCuadernoUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const records = await loadCourseCoversForUser(user.id);
    return NextResponse.json({
      covers: mergeCourseCoverMaps(
        records.map((r) => ({ courseId: r.courseId, coverArt: r.coverArt })),
      ),
    });
  } catch (caught) {
    console.error("[cuaderno/covers GET]", caught);
    return NextResponse.json({ error: "Error al cargar portadas." }, { status: 500 });
  }
}
