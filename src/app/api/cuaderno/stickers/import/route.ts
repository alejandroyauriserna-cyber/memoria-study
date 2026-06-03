import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchUrlAsImageDataUrl } from "@/lib/cuaderno/fetch-remote-image";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await request.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) return NextResponse.json({ error: "URL requerida" }, { status: 400 });

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    }

    const { imageDataUrl } = await fetchUrlAsImageDataUrl(url, { maxBytes: 5_000_000 });

    const nameVal = typeof body.name === "string" ? body.name.trim() : "";
    const labelVal = typeof body.label === "string" ? body.label.trim() : "";
    const label =
      nameVal ||
      labelVal ||
      parsed.pathname.split("/").pop()?.replace(/\.\w+$/, "") ||
      "Sticker importado";

    return NextResponse.json({ imageDataUrl, label: label.slice(0, 80), sourceUrl: url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al importar" },
      { status: 500 },
    );
  }
}
