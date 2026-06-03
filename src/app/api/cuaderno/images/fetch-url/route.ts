import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 6_000_000;

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

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MemoriaStudy/1.0)",
        Accept: "image/*,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `No se pudo descargar la imagen (${res.status})` },
        { status: 502 },
      );
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "La URL no apunta a una imagen. Prueba «Copiar imagen» en Pinterest." },
        { status: 400 },
      );
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      return NextResponse.json({ error: "Imagen demasiado grande" }, { status: 400 });
    }

    const dataUrl = `data:${contentType};base64,${buf.toString("base64")}`;
    return NextResponse.json({ dataUrl });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al importar imagen" },
      { status: 500 },
    );
  }
}
