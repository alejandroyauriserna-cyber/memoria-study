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
    const { data: existingLike, error: likeError } = await admin
      .from("material_likes")
      .select("id")
      .eq("material_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (likeError) {
      throw likeError;
    }

    let likes = 0;

    if (existingLike) {
      const { error: deleteError } = await admin
        .from("material_likes")
        .delete()
        .eq("id", existingLike.id);

      if (deleteError) {
        throw deleteError;
      }
    } else {
      const { error: insertError } = await admin.from("material_likes").insert({
        material_id: id,
        user_id: user.id,
      });

      if (insertError) {
        throw insertError;
      }
    }

    const { data: material, error: materialError } = await admin
      .from("materials")
      .select("likes")
      .eq("id", id)
      .maybeSingle();

    if (materialError) {
      throw materialError;
    }

    if (!material) {
      return NextResponse.json({ error: "Material no encontrado." }, { status: 404 });
    }

    if (existingLike) {
      likes = Math.max(0, material.likes - 1);
    } else {
      likes = (material.likes ?? 0) + 1;
    }

    const { error: updateError } = await admin
      .from("materials")
      .update({ likes })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ likes });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error registrando like." },
      { status: 500 },
    );
  }
}
