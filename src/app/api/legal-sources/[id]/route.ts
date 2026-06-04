import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: row, error: fetchError } = await admin
      .schema("public")
      .from("legal_sources")
      .select("id, kind, file_url")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !row) {
      return NextResponse.json({ error: "Fuente no encontrada." }, { status: 404 });
    }

    if (row.kind === "builtin") {
      return NextResponse.json({ error: "No se pueden eliminar fuentes integradas." }, { status: 400 });
    }

    const { error: deleteError } = await admin
      .schema("public")
      .from("legal_sources")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      return NextResponse.json({ error: "No se pudo eliminar la fuente." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (caught) {
    console.error("[legal-sources DELETE]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al eliminar fuente." },
      { status: 500 },
    );
  }
}
