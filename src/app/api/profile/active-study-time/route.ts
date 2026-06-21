import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { getStudyWeekKey } from "@/lib/study/study-week-key";

const bodySchema = z.object({
  activeStudyMs: z.number().int().min(0).max(50_000 * 60 * 60 * 1000),
});

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

    const { activeStudyMs } = bodySchema.parse(await request.json());
    const admin = createAdminClient();
    const weekKey = getStudyWeekKey(new Date());

    const { data: existing, error: readError } = await admin
      .from("user_profiles")
      .select("active_study_ms, active_study_ms_week, active_study_week_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) throw readError;

    const currentMs = Number(existing?.active_study_ms ?? 0);
    const nextMs = Math.max(currentMs, activeStudyMs);
    const delta = Math.max(0, nextMs - currentMs);

    let weekMs = Number(existing?.active_study_ms_week ?? 0);
    const storedWeekKey = existing?.active_study_week_key ?? null;
    if (storedWeekKey !== weekKey) {
      weekMs = 0;
    }
    weekMs += delta;

    const { error: writeError } = await admin.from("user_profiles").upsert(
      {
        user_id: user.id,
        active_study_ms: nextMs,
        active_study_ms_week: weekMs,
        active_study_week_key: weekKey,
      },
      { onConflict: "user_id" },
    );

    if (writeError) throw writeError;

    return NextResponse.json({
      ok: true,
      activeStudyMs: nextMs,
      activeStudyMsWeek: weekMs,
    });
  } catch (caught) {
    if (caught instanceof z.ZodError) {
      return NextResponse.json({ error: "Tiempo de estudio inválido." }, { status: 400 });
    }

    console.error("[profile/active-study-time]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo guardar el tiempo activo." },
      { status: 500 },
    );
  }
}
