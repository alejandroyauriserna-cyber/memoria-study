import { NextResponse } from "next/server";
import { saveAiItemForUser } from "@/lib/cuaderno/collections-server";
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

    const body = (await request.json()) as {
      kind?: "exam" | "summary";
      classId?: string;
      courseName?: string;
      classTitle?: string;
      title?: string;
      content?: string;
    };

    if (!body.kind || !body.courseName || !body.title || !body.content) {
      return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
    }

    const item = await saveAiItemForUser(user.id, body.kind, {
      classId: body.classId,
      courseName: body.courseName,
      classTitle: body.classTitle,
      title: body.title,
      content: body.content,
    });

    return NextResponse.json({ item });
  } catch (caught) {
    console.error("[cuaderno/collections/items]", caught);
    return NextResponse.json({ error: "Error al guardar ítem." }, { status: 500 });
  }
}
