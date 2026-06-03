import { NextResponse } from "next/server";
import { loadCollectionsForUser } from "@/lib/cuaderno/collections-server";
import { requireCuadernoUser } from "@/lib/cuaderno/auth";
import { hasSupabaseEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
    }

    const user = await requireCuadernoUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const snapshot = await loadCollectionsForUser(user.id);
    return NextResponse.json(snapshot);
  } catch (caught) {
    console.error("[cuaderno/collections GET]", caught);
    return NextResponse.json({ error: "Error al cargar colecciones." }, { status: 500 });
  }
}
