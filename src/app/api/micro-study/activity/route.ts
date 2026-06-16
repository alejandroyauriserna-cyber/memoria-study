import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

const activitySchema = z.object({
  activityType: z.enum([
    "micro_session_completed",
    "concept_reviewed",
    "sentencia_read",
    "daily_active",
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

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

    const body = activitySchema.parse(await request.json());
    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase.from("micro_study_activity").insert({
      user_id: user.id,
      activity_date: today,
      activity_type: body.activityType,
      metadata: body.metadata ?? {},
    });

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ ok: true, persisted: false });
      }
      throw error;
    }

    return NextResponse.json({ ok: true, persisted: true });
  } catch (error) {
    console.error("[micro-study/activity POST]", error);
    return NextResponse.json({ error: "No se pudo registrar la actividad." }, { status: 500 });
  }
}
