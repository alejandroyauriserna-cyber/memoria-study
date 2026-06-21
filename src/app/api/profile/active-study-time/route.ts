import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

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

    const { data: existing, error: readError } = await admin
      .from("user_profiles")
      .select("active_study_ms")
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) throw readError;

    const currentMs = Number(existing?.active_study_ms ?? 0);
    const nextMs = Math.max(currentMs, activeStudyMs);

    const { error: writeError } = await admin.from("user_profiles").upsert(
      {
        user_id: user.id,
        active_study_ms: nextMs,
      },
      { onConflict: "user_id" },
    );

    if (writeError) throw writeError;

    return NextResponse.json({ ok: true, activeStudyMs: nextMs });
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
