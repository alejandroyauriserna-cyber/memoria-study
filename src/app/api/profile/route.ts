import { NextResponse } from "next/server";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
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
  studySettings: z
    .object({
      preferences: z
        .object({
          conceptMaps: z.boolean(),
          flashcards: z.boolean(),
          exams: z.boolean(),
          practicalCases: z.boolean(),
        })
        .optional(),
      theme: z.enum(["cyan", "ocean", "amber", "violet"]).optional(),
      goals: z
        .array(
          z.object({
            id: z.string(),
            label: z.string(),
            completed: z.boolean(),
            createdAt: z.number(),
          }),
        )
        .optional(),
    })
    .optional(),
});

type ProfileShape = {
  full_name: string | null;
  current_cycle_number: number | null;
  current_cycle_label: string | null;
  academic_context: unknown;
  email: string | null;
};

function profileFromAuthUser(user: User): ProfileShape {
  const metadata = user.user_metadata ?? {};

  return {
    full_name: (metadata.full_name as string | undefined) ?? null,
    current_cycle_number: (metadata.current_cycle_number as number | undefined) ?? null,
    current_cycle_label: (metadata.current_cycle_label as string | undefined) ?? null,
    academic_context: metadata.academic_context ?? metadata.academic ?? {},
    email: user.email ?? null,
  };
}

function buildProfilePayload(
  user: User,
  body: z.infer<typeof bodySchema>,
): ProfileShape & { user_id: string } {
  return {
    user_id: user.id,
    email: user.email ?? body.email ?? null,
    academic_context: body.academic ?? undefined,
    full_name: body.fullName ?? (user.user_metadata?.full_name as string | undefined) ?? null,
    current_cycle_number:
      body.currentCycle?.cycleNumber ??
      (user.user_metadata?.current_cycle_number as number | undefined) ??
      null,
    current_cycle_label:
      body.currentCycle?.cycleLabel ??
      (user.user_metadata?.current_cycle_label as string | undefined) ??
      null,
  };
}

async function saveProfileToUserMetadata(
  admin: ReturnType<typeof createAdminClient>,
  user: User,
  body: z.infer<typeof bodySchema>,
  profilePayload: ProfileShape,
) {
  const metadata = {
    ...user.user_metadata,
    full_name: profilePayload.full_name,
    current_cycle_number: profilePayload.current_cycle_number,
    current_cycle_label: profilePayload.current_cycle_label,
  };

  if (body.academic) {
    Object.assign(metadata, {
      academic: body.academic,
      academic_context: body.academic,
    });
  }

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: metadata,
  });

  if (error) {
    throw error;
  }
}

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
    const { data, error } = await admin
      .from("user_profiles")
      .select(
        "full_name, current_cycle_number, current_cycle_label, academic_context, email",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ profile: profileFromAuthUser(user) });
    }

    return NextResponse.json({ profile: data ?? profileFromAuthUser(user) });
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

    const profilePayload = buildProfilePayload(user, body);
    const admin = createAdminClient();

    const { data: existingProfile } = await admin
      .from("user_profiles")
      .select("academic_context")
      .eq("user_id", user.id)
      .maybeSingle();

    const priorContext =
      existingProfile?.academic_context && typeof existingProfile.academic_context === "object"
        ? (existingProfile.academic_context as Record<string, unknown>)
        : {};

    if (body.academic) {
      profilePayload.academic_context = { ...priorContext, ...body.academic };
    } else if (body.studySettings) {
      profilePayload.academic_context = {
        ...priorContext,
        studyPreferences: body.studySettings.preferences ?? priorContext.studyPreferences,
        theme: body.studySettings.theme ?? priorContext.theme,
        goals: body.studySettings.goals ?? priorContext.goals,
      };
    } else {
      profilePayload.academic_context = priorContext;
    }

    const { error } = await admin.from("user_profiles").upsert(profilePayload, {
      onConflict: "user_id",
    });

    if (error) {
      await saveProfileToUserMetadata(admin, user, body, profilePayload);
    }

    return NextResponse.json({ saved: true, profile: profilePayload });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo guardar el perfil." },
      { status: 500 },
    );
  }
}
