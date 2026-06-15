import { NextResponse } from "next/server";
import { listCollaboratedClasses, requireCuadernoUser } from "@/lib/cuaderno/auth";
import { joinCuadernoByToken } from "@/lib/cuaderno/share-server";
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

    const sharedWithMe = await listCollaboratedClasses(user.id);
    return NextResponse.json({ sharedWithMe });
  } catch (caught) {
    console.error("[cuaderno/shared GET]", caught);
    return NextResponse.json({ error: "Error al cargar apuntes compartidos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
    }

    const user = await requireCuadernoUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const body = (await request.json()) as { token?: string };
    if (!body.token?.trim()) {
      return NextResponse.json({ error: "Token requerido." }, { status: 400 });
    }

    const result = await joinCuadernoByToken(user.id, body.token.trim());
    return NextResponse.json(result);
  } catch (caught) {
    console.error("[cuaderno/shared POST]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo unir al cuaderno." },
      { status: 400 },
    );
  }
}
