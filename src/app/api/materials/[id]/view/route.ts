import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export const runtime = "nodejs";

async function canOpenFile(fileUrl: string, origin: string) {
  try {
    const targetUrl = new URL(fileUrl, origin);
    const response = await fetch(targetUrl, { method: "HEAD", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

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
    const { data: material, error: materialError } = await admin
      .schema("public")
      .from("materials")
      .select("id,file_url,views")
      .eq("id", id)
      .maybeSingle();

    if (materialError) {
      throw materialError;
    }

    if (!material) {
      return NextResponse.json({ error: "Material no encontrado." }, { status: 404 });
    }

    const isReachable = await canOpenFile(material.file_url, request.url);
    if (!isReachable) {
      return NextResponse.json({ error: "No se pudo abrir el PDF." }, { status: 502 });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingView, error: viewError } = await admin
      .schema("public")
      .from("material_views")
      .select("id")
      .eq("material_id", id)
      .eq("user_id", user.id)
      .gte("viewed_at", since)
      .maybeSingle();

    if (viewError) {
      throw viewError;
    }

    let views = material.views ?? 0;
    let counted = false;

    if (!existingView) {
      const { error: insertError } = await admin
        .schema("public")
        .from("material_views")
        .insert({
          material_id: id,
          user_id: user.id,
        });

      if (insertError) {
        throw insertError;
      }

      views += 1;
      counted = true;

      const { error: updateError } = await admin
        .schema("public")
        .from("materials")
        .update({ views })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }
    }

    await admin
      .schema("public")
      .from("material_study_history")
      .upsert(
        {
          user_id: user.id,
          material_id: id,
          opened_at: new Date().toISOString(),
        },
        { onConflict: "user_id,material_id" },
      );

    return NextResponse.json({ counted, fileUrl: material.file_url, views });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error registrando vista." },
      { status: 500 },
    );
  }
}
