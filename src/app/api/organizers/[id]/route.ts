import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!env.supabaseUrl || !env.supabaseAnonKey) {
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
    const { data: organizer, error: selectError } = await admin
      .from("organizers")
      .select("id,user_id")
      .eq("id", id)
      .maybeSingle();

    if (selectError) throw selectError;

    if (!organizer) {
      return NextResponse.json({ error: "Organizador no encontrado." }, { status: 404 });
    }

    if (organizer.user_id !== user.id) {
      return NextResponse.json({ error: "No tienes permiso para eliminar este organizador." }, { status: 403 });
    }

    const { error: deleteError } = await admin.from("organizers").delete().eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (caught) {
    console.error("[organizers/delete]", caught);
    return NextResponse.json(
      { error: "No se pudo eliminar el organizador. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
