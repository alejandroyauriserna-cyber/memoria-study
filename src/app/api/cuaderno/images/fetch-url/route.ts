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
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    }

    const { imageDataUrl, resolvedUrl } = await fetchUrlAsImageDataUrl(url, {
      maxBytes: 6_000_000,
    });

    return NextResponse.json({ dataUrl: imageDataUrl, resolvedUrl });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al importar imagen" },
      { status: 500 },
    );
  }
}
