import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { env, hasSupabaseEnv } from "@/lib/env";

export async function POST(
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
    const { data: organizer, error: fetchError } = await admin
      .from("organizers")
      .select("id,user_id,share_token,is_shared")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!organizer || organizer.user_id !== user.id) {
      return NextResponse.json({ error: "Organizador no encontrado." }, { status: 404 });
    }

    const shareToken =
      organizer.share_token ?? randomBytes(16).toString("hex");

    const { error: updateError } = await admin
      .from("organizers")
      .update({ share_token: shareToken, is_shared: true })
      .eq("id", id);

    if (updateError) throw updateError;

    const shareUrl = `${env.appUrl.replace(/\/$/, "")}/organizers?share=${shareToken}`;

    return NextResponse.json({ shareUrl, shareToken });
  } catch (error) {
    console.error("[organizers/share]", error);
    return NextResponse.json({ error: "No se pudo generar el enlace." }, { status: 500 });
  }
}
