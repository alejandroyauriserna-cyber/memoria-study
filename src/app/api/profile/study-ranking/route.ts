import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

const bodySchema = z.object({
  showInStudyRanking: z.boolean(),
});

export async function PATCH(request: Request) {
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

    const { showInStudyRanking } = bodySchema.parse(await request.json());
    const admin = createAdminClient();

    const { error } = await admin.from("user_profiles").upsert(
      {
        user_id: user.id,
        show_in_study_ranking: showInStudyRanking,
      },
      { onConflict: "user_id" },
    );

    if (error) throw error;

    return NextResponse.json({ ok: true, showInStudyRanking });
  } catch (caught) {
    if (caught instanceof z.ZodError) {
      return NextResponse.json({ error: "Preferencia de ranking inválida." }, { status: 400 });
    }

    console.error("[profile/study-ranking]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo guardar la preferencia." },
      { status: 500 },
    );
  }
}
