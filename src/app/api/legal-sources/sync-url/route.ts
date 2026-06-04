import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { fetchUrlContent } from "@/lib/legal-sources/fetch-url-content";
import { getLpPresetById, isAllowedLpUrl } from "@/lib/legal-sources/lp-presets";
import {
  buildExtractedSummary,
  parseLpLegalArticles,
} from "@/lib/legal-sources/parse-lp-html";
import { mapDbRowToLegalSource, truncateExtractedText } from "@/lib/legal-sources/server";

export const runtime = "nodejs";
export const maxDuration = 120;

function rowToClientSource(row: Record<string, unknown>) {
  return mapDbRowToLegalSource(row);
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const body = (await request.json()) as { presetId?: string; sourceUrl?: string };
    const preset = body.presetId ? getLpPresetById(body.presetId) : undefined;
    const sourceUrl = preset?.url ?? body.sourceUrl?.trim();

    if (!sourceUrl || !isAllowedLpUrl(sourceUrl)) {
      return NextResponse.json(
        { error: "Solo se admiten URLs de lpderecho.pe desde el catálogo LP." },
        { status: 400 },
      );
    }

    const html = await fetchUrlContent(sourceUrl);
    const syncedAt = new Date().toISOString();
    const admin = createAdminClient();

    const existingQuery = admin
      .schema("public")
      .from("legal_sources")
      .select("id")
      .eq("user_id", user.id);

    const { data: existing } = preset
      ? await existingQuery.eq("lp_preset_id", preset.id).maybeSingle()
      : await existingQuery.eq("source_url", sourceUrl).maybeSingle();

    const sourceId = existing?.id ?? crypto.randomUUID();
    const norm = preset?.norm ?? "Normativa LP";
    const normShort = preset?.normShort ?? "LP";
    const title = preset?.title ?? `Fuente LP — ${norm}`;

    const articles = parseLpLegalArticles(html, {
      norm,
      normShort,
      sourceId,
      sourceUrl,
      syncedAt,
    });

    if (!articles.length) {
      return NextResponse.json(
        { error: "No se pudieron extraer artículos de la página. LP puede haber cambiado su formato." },
        { status: 422 },
      );
    }

    const extractedText = truncateExtractedText(buildExtractedSummary(articles));
    const payload = {
      user_id: user.id,
      title,
      category: "normativa" as const,
      kind: "url" as const,
      author: "LP Pasión por el Derecho",
      description: preset?.description ?? `Sincronizado desde ${sourceUrl}`,
      source_url: sourceUrl,
      lp_preset_id: preset?.id ?? null,
      parsed_articles: articles,
      article_count: articles.length,
      extracted_text: extractedText,
      last_synced_at: syncedAt,
      enabled: true,
      priority: 1,
      updated_at: syncedAt,
    };

    const { data: row, error } = existing
      ? await admin
          .schema("public")
          .from("legal_sources")
          .update(payload)
          .eq("id", sourceId)
          .eq("user_id", user.id)
          .select("*")
          .single()
      : await admin
          .schema("public")
          .from("legal_sources")
          .insert({ ...payload, id: sourceId })
          .select("*")
          .single();

    if (error || !row) {
      console.error("[legal-sources/sync-url]", error);
      return NextResponse.json({ error: "No se pudo guardar la fuente sincronizada." }, { status: 500 });
    }

    return NextResponse.json({
      source: rowToClientSource(row),
      articleCount: articles.length,
      syncedAt,
    });
  } catch (caught) {
    console.error("[legal-sources/sync-url]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al sincronizar fuente web." },
      { status: 500 },
    );
  }
}
