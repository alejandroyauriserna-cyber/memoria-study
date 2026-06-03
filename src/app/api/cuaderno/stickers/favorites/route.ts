import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await request.json();
    const stickerId = typeof body.stickerId === "string" ? body.stickerId : "";
    if (!stickerId) return NextResponse.json({ error: "stickerId requerido" }, { status: 400 });

    const { data: owned } = await supabase
      .from("cuaderno_user_stickers")
      .select("id")
      .eq("id", stickerId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!owned) {
      return NextResponse.json({ error: "Sticker no encontrado" }, { status: 404 });
    }

    const { error } = await supabase.from("user_sticker_favorites").upsert(
      { user_id: user.id, sticker_id: stickerId },
      { onConflict: "user_id,sticker_id" },
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, isFavorite: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const stickerId = searchParams.get("stickerId");
    if (!stickerId) return NextResponse.json({ error: "stickerId requerido" }, { status: 400 });

    const { error } = await supabase
      .from("user_sticker_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("sticker_id", stickerId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, isFavorite: false });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}
