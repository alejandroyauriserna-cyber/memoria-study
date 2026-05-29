import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: Request, context: any) {
  const { id } = context.params;

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

    const admin = createAdminClient();
    const { data: existing, error: selectError } = await admin
      .from("material_favorites")
      .select("id")
      .eq("material_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    let isFavorite = false;

    if (existing) {
      const { error: deleteError } = await admin
        .from("material_favorites")
        .delete()
        .eq("id", existing.id);

      if (deleteError) {
        throw deleteError;
      }
    } else {
      const { error: insertError } = await admin.from("material_favorites").insert({
        material_id: id,
        user_id: user.id,
      });

      if (insertError) {
        throw insertError;
      }
      isFavorite = true;
    }

    return NextResponse.json({ isFavorite });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error actualizando favorito." },
      { status: 500 },
    );
  }
}
