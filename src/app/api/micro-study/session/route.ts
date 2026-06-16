import { NextResponse } from "next/server";
import { loadMicroSessionForUser } from "@/lib/micro-study/load-micro-dashboard";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export async function GET(request: Request) {
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

    const focus = new URL(request.url).searchParams.get("focus");
    const mode = new URL(request.url).searchParams.get("mode");
    const session = await loadMicroSessionForUser(
      user.id,
      focus,
      mode === "daily-concept" ? "daily-concept" : "default",
    );

    return NextResponse.json({ session });
  } catch (error) {
    console.error("[micro-study/session GET]", error);
    return NextResponse.json({ error: "No se pudo generar la sesión." }, { status: 500 });
  }
}
