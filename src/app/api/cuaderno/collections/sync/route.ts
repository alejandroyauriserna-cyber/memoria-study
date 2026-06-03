import { NextResponse } from "next/server";
import { migrateLocalCollections } from "@/lib/cuaderno/collections-server";
import { requireCuadernoUser } from "@/lib/cuaderno/auth";
import type { SavedAiItem } from "@/lib/cuaderno/smart-collections";
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
      favoriteClassIds?: string[];
      examItems?: SavedAiItem[];
      summaryItems?: SavedAiItem[];
    };

    await migrateLocalCollections(user.id, body);
    return NextResponse.json({ ok: true });
  } catch (caught) {
    console.error("[cuaderno/collections/sync]", caught);
    return NextResponse.json({ error: "Error al sincronizar." }, { status: 500 });
  }
}
