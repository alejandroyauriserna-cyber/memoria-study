import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export const runtime = "nodejs";

const VIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000;

async function canOpenFile(fileUrl: string, origin: string) {
  try {
    const targetUrl = new URL(fileUrl, origin);
    const response = await fetch(targetUrl, { method: "HEAD", cache: "no-store" });
    if (response.ok) {
      return true;
    }

    const rangeResponse = await fetch(targetUrl, {
      headers: { Range: "bytes=0-0" },
      cache: "no-store",
    });

    return rangeResponse.ok;
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
      .select("id,file_url")
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

    const since = new Date(Date.now() - VIEW_COOLDOWN_MS).toISOString();
    const { data: recentView, error: viewError } = await admin
      .schema("public")
      .from("material_views")
      .select("id")
      .eq("material_id", id)
      .eq("user_id", user.id)
      .gte("viewed_at", since)
      .order("viewed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (viewError) {
      throw viewError;
    }

    let counted = false;

    if (!recentView) {
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

      counted = true;
    }

    const { count: views, error: countError } = await admin
      .schema("public")
      .from("material_views")
      .select("id", { count: "exact", head: true })
      .eq("material_id", id);

    if (countError) {
      throw countError;
    }

    const { error: updateError } = await admin
      .schema("public")
      .from("materials")
      .update({ views: views ?? 0 })
      .eq("id", id);

    if (updateError) {
      throw updateError;
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

    return NextResponse.json({ counted, fileUrl: material.file_url, views: views ?? 0 });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error registrando vista." },
      { status: 500 },
    );
  }
}
