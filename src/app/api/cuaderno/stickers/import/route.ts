import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  extractImageUrlFromHtml,
  isHtmlContentType,
  isLikelyImageContentType,
} from "@/lib/cuaderno/resolve-import-image-url";

const MAX_BYTES = 5_000_000;

function isPrivateHost(hostname: string) {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local")) return true;
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) {
    return true;
  }
  return false;
}

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

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Solo HTTP/HTTPS" }, { status: 400 });
    }
    if (isPrivateHost(parsed.hostname)) {
      return NextResponse.json({ error: "URL no permitida" }, { status: 400 });
    }

    let fetchUrl = url;
    const res = await fetch(fetchUrl, {
      headers: { "User-Agent": "MemoriaStudy-StickerImport/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `No se pudo descargar (${res.status})` }, { status: 400 });
    }

    let contentType = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";

    if (isHtmlContentType(contentType) || contentType === "") {
      const html = await res.text();
      const extracted = extractImageUrlFromHtml(html, url);
      if (!extracted) {
        return NextResponse.json(
          {
            error:
              "No se encontró imagen en la página. Usa un enlace directo (i.pinimg.com) o sube el archivo.",
          },
          { status: 400 },
        );
      }
      fetchUrl = extracted;
      const imgRes = await fetch(fetchUrl, {
        headers: { "User-Agent": "MemoriaStudy-StickerImport/1.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
      });
      if (!imgRes.ok) {
        return NextResponse.json({ error: `Imagen no accesible (${imgRes.status})` }, { status: 400 });
      }
      contentType = imgRes.headers.get("content-type")?.split(";")[0]?.trim() ?? "image/jpeg";
      if (!isLikelyImageContentType(contentType)) {
        return NextResponse.json({ error: "Formato no soportado. Usa PNG, JPG o WEBP." }, { status: 400 });
      }
      const buf = Buffer.from(await imgRes.arrayBuffer());
      if (buf.length > MAX_BYTES) {
        return NextResponse.json({ error: "Imagen demasiado grande (máx. 5 MB)" }, { status: 400 });
      }
      const base64 = buf.toString("base64");
      const imageDataUrl = `data:${contentType};base64,${base64}`;
      const nameVal = typeof body.name === "string" ? body.name.trim() : "";
      const labelVal = typeof body.label === "string" ? body.label.trim() : "";
      const label =
        nameVal ||
        labelVal ||
        parsed.pathname.split("/").pop()?.replace(/\.\w+$/, "") ||
        "Sticker importado";

      return NextResponse.json({ imageDataUrl, label: label.slice(0, 80), sourceUrl: url });
    }

    if (!isLikelyImageContentType(contentType)) {
      return NextResponse.json({ error: "Formato no soportado. Usa PNG, JPG o WEBP." }, { status: 400 });
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      return NextResponse.json({ error: "Imagen demasiado grande (máx. 5 MB)" }, { status: 400 });
    }

    const base64 = buf.toString("base64");
    const imageDataUrl = `data:${contentType};base64,${base64}`;
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
