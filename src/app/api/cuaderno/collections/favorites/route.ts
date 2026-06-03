import { NextResponse } from "next/server";
import { toggleFavoriteForUser } from "@/lib/cuaderno/collections-server";
import { requireCuadernoUser } from "@/lib/cuaderno/auth";
import { hasSupabaseEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
    }

    const user = await requireCuadernoUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const body = (await request.json()) as { classId?: string };
    if (!body.classId) {
      return NextResponse.json({ error: "classId requerido." }, { status: 400 });
    }

    const isFavorite = await toggleFavoriteForUser(user.id, body.classId);
    return NextResponse.json({ isFavorite });
  } catch (caught) {
    console.error("[cuaderno/collections/favorites]", caught);
    return NextResponse.json({ error: "Error al actualizar favorito." }, { status: 500 });
  }
}
