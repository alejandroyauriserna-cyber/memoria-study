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

const bodySchema = z.object({
  academic: academicSchema,
  email: z.string().email().optional(),
});

export async function GET() {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ academic: null });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ academic: null });
    }

    const admin = createAdminClient();
    const { data } = await admin
      .from("user_profiles")
      .select("academic_context")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({ academic: data?.academic_context ?? null });
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
        academic: body.academic,
      });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("user_profiles").upsert({
      user_id: user.id,
      email: user.email ?? body.email ?? null,
      academic_context: body.academic,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ saved: true, academic: body.academic });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo guardar el perfil." },
      { status: 500 },
    );
  }
}
