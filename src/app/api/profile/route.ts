import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

const academicSchema = z.object({
  yearNumber: z.number(),
  yearLabel: z.string(),
  cycleNumber: z.number(),
  cycleLabel: z.string(),
  courseId: z.string(),
  courseName: z.string(),
  weekNumber: z.number(),
  weekTitle: z.string(),
});

const currentCycleSchema = z.object({
  cycleNumber: z.number(),
  cycleLabel: z.string(),
});

const bodySchema = z.object({
  academic: academicSchema.optional(),
  email: z.string().email().optional(),
  fullName: z.string().min(3).optional(),
  currentCycle: currentCycleSchema.optional(),
});

export async function GET() {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ profile: null });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ profile: null });
    }

    const admin = createAdminClient();
    const { data } = await admin
      .from("user_profiles")
      .select(
        "full_name, current_cycle_number, current_cycle_label, academic_context, email",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({ profile: data ?? null });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al leer perfil." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json(
        { error: "Supabase no está configurado." },
        { status: 503 },
      );
    }

    const body = bodySchema.parse(await request.json());
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        saved: false,
        message: "Perfil pendiente hasta confirmar el enlace del correo.",
        profile: null,
      });
    }

    const profilePayload = {
      user_id: user.id,
      email: user.email ?? body.email ?? null,
      academic_context: body.academic ?? undefined,
      full_name: body.fullName ?? user.user_metadata?.full_name ?? null,
      current_cycle_number:
        body.currentCycle?.cycleNumber ?? user.user_metadata?.current_cycle_number ?? null,
      current_cycle_label:
        body.currentCycle?.cycleLabel ?? user.user_metadata?.current_cycle_label ?? null,
    };

    const admin = createAdminClient();
    const { error } = await admin.from("user_profiles").upsert(profilePayload, {
      onConflict: "user_id",
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ saved: true, profile: profilePayload });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo guardar el perfil." },
      { status: 500 },
    );
  }
}
