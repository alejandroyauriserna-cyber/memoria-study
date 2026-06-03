import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  dataUrlToBuffer,
  parseStoragePath,
  removeStickerFiles,
  signedStickerUrl,
  stickerStoragePath,
  uploadStickerBuffer,
} from "@/lib/cuaderno/sticker-storage";
import type { UserStickerRecord } from "@/types/cuaderno-stickers";

async function resolveImageUrl(imageUrl: string): Promise<string> {
  const path = parseStoragePath(imageUrl) ?? imageUrl;
  if (path.includes("://")) return imageUrl;
  return signedStickerUrl(path);
}

async function mapRow(
  row: Record<string, unknown>,
  favoriteIds: Set<string>,
): Promise<UserStickerRecord> {
  const storagePath = parseStoragePath(String(row.image_url ?? "")) ?? String(row.image_url ?? "");
  const signed = await resolveImageUrl(storagePath);
  const id = String(row.id);
  return {
    id,
    name: String(row.name ?? ""),
    imageUrl: signed,
    storagePath,
    createdAt: String(row.created_at),
    isFavorite: favoriteIds.has(id),
  };
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const favoritesOnly = searchParams.get("favorites") === "1";

    const { data: favRows } = await supabase
      .from("user_sticker_favorites")
      .select("sticker_id")
      .eq("user_id", user.id);
    const favoriteIds = new Set((favRows ?? []).map((r) => String(r.sticker_id)));

    let query = supabase
      .from("cuaderno_user_stickers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let rows = data ?? [];
    if (favoritesOnly) {
      rows = rows.filter((r) => favoriteIds.has(String(r.id)));
    }
    if (q) {
      rows = rows.filter((r) => String(r.name ?? "").toLowerCase().includes(q));
    }

    const stickers = await Promise.all(
      rows.map((row) => mapRow(row as Record<string, unknown>, favoriteIds)),
    );

    return NextResponse.json({ stickers });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al listar stickers" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await request.json();
    const imageDataUrl = typeof body.imageDataUrl === "string" ? body.imageDataUrl : "";
    const name =
      typeof body.name === "string" ? body.name.trim().slice(0, 80) : "Mi sticker";

    if (!imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Imagen inválida" }, { status: 400 });
    }

    const { buffer, mime } = dataUrlToBuffer(imageDataUrl);
    if (buffer.length > 4_500_000) {
      return NextResponse.json({ error: "Imagen demasiado grande (máx. ~4 MB)" }, { status: 400 });
    }

    const stickerId = crypto.randomUUID();
    let storagePath: string;
    try {
      ({ storagePath } = await uploadStickerBuffer(user.id, stickerId, buffer, mime));
    } catch (uploadErr) {
      return NextResponse.json(
        { error: uploadErr instanceof Error ? uploadErr.message : "Error al subir a Storage" },
        { status: 500 },
      );
    }

    const { data: row, error } = await supabase
      .from("cuaderno_user_stickers")
      .insert({
        id: stickerId,
        user_id: user.id,
        name: name || "Mi sticker",
        image_url: storagePath,
      })
      .select("*")
      .single();

    if (error) {
      await removeStickerFiles([storagePath]).catch(() => {});
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const sticker = await mapRow(row as Record<string, unknown>, new Set());
    return NextResponse.json({ sticker });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al guardar sticker" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    if (typeof body.name === "string") {
      const { error } = await supabase
        .from("cuaderno_user_stickers")
        .update({ name: body.name.slice(0, 80) })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: favRows } = await supabase
      .from("user_sticker_favorites")
      .select("sticker_id")
      .eq("user_id", user.id);
    const favoriteIds = new Set((favRows ?? []).map((r) => String(r.sticker_id)));

    const { data: row } = await supabase
      .from("cuaderno_user_stickers")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    const sticker = await mapRow(row as Record<string, unknown>, favoriteIds);
    return NextResponse.json({ sticker });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al actualizar" },
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
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const { data: row } = await supabase
      .from("cuaderno_user_stickers")
      .select("image_url")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    await supabase.from("user_sticker_favorites").delete().eq("sticker_id", id).eq("user_id", user.id);

    const { error } = await supabase
      .from("cuaderno_user_stickers")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (row?.image_url) {
      const path = parseStoragePath(String(row.image_url)) ?? String(row.image_url);
      if (path && !path.includes("://")) await removeStickerFiles([path]);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al eliminar" },
      { status: 500 },
    );
  }
}
