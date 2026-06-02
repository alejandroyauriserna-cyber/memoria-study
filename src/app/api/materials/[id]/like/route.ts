import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: Request, context: any) {
  const { id } = await context.params;
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
      .schema("public")
      .from("material_likes")
      .select("id")
      .eq("material_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (likeError) {
      throw likeError;
    }

    if (existingLike) {
      const { error: deleteError } = await admin
        .schema("public")
        .from("material_likes")
        .delete()
        .eq("id", existingLike.id);

      if (deleteError) {
        throw deleteError;
      }
    } else {
      const { error: insertError } = await admin
        .schema("public")
        .from("material_likes")
        .insert({
          material_id: id,
          user_id: user.id,
        });

      if (insertError) {
        throw insertError;
      }
    }

    const { count: likes, error: countError } = await admin
      .schema("public")
      .from("material_likes")
      .select("id", { count: "exact", head: true })
      .eq("material_id", id);

    if (countError) {
      throw countError;
    }

    const { data: material, error: updateError } = await admin
      .schema("public")
      .from("materials")
      .update({ likes: likes ?? 0 })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    if (!material) {
      return NextResponse.json({ error: "Material no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ likes: likes ?? 0 });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error registrando like." },
      { status: 500 },
    );
  }
}
