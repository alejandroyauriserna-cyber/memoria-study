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
    const { data: material, error: selectError } = await admin
      .from("materials")
      .select("downloads")
      .eq("id", id)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    if (!material) {
      return NextResponse.json({ error: "Material no encontrado." }, { status: 404 });
    }

    const downloads = (material.downloads ?? 0) + 1;
    const { error: updateError } = await admin
      .from("materials")
      .update({ downloads })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ downloads });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error registrando descarga." },
      { status: 500 },
    );
  }
}
