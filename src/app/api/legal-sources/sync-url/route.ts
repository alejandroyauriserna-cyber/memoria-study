import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import {
  buildWaybackSyncNote,
  fetchUrlContentDetailed,
} from "@/lib/legal-sources/fetch-url-content";
import { getLpPresetById, isAllowedLpUrl } from "@/lib/legal-sources/lp-presets";
import { sanitizeLpUrlList } from "@/lib/legal-sources/lp-url-overrides";
import {
  buildExtractedSummary,
  mergeLegalArticleRecords,
  parseLpLegalArticles,
} from "@/lib/legal-sources/parse-lp-html";
import { mapDbRowToLegalSource, truncateExtractedText } from "@/lib/legal-sources/server";

export const runtime = "nodejs";
export const maxDuration = 120;

function rowToClientSource(row: Record<string, unknown>) {
  return mapDbRowToLegalSource(row);
}

function resolveSourceUrls(body: {
  presetId?: string;
  sourceUrl?: string;
  sourceUrls?: string[];
}): { preset: ReturnType<typeof getLpPresetById>; urls: string[] } {
  const preset = body.presetId ? getLpPresetById(body.presetId) : undefined;
  const fromBody = sanitizeLpUrlList(
    body.sourceUrls?.length
      ? body.sourceUrls
      : body.sourceUrl
        ? [body.sourceUrl]
        : [],
  );

  const urls = fromBody.length ? fromBody : preset ? [preset.url] : [];

  return { preset, urls };
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

    const body = (await request.json()) as {
      presetId?: string;
      sourceUrl?: string;
      sourceUrls?: string[];
      title?: string;
      norm?: string;
      normShort?: string;
    };

    const { preset, urls: sourceUrls } = resolveSourceUrls(body);

    if (!sourceUrls.length) {
      return NextResponse.json({ error: "Debes indicar al menos una URL de LP." }, { status: 400 });
    }

    for (const url of sourceUrls) {
      if (!isAllowedLpUrl(url)) {
        return NextResponse.json(
          { error: `URL no permitida: ${url}. Solo se admiten enlaces de lpderecho.pe.` },
          { status: 400 },
        );
      }
    }

    const syncedAt = new Date().toISOString();
    const admin = createAdminClient();

    const existingQuery = admin
      .schema("public")
      .from("legal_sources")
      .select("id")
      .eq("user_id", user.id);

    const { data: existing } = preset
      ? await existingQuery.eq("lp_preset_id", preset.id).maybeSingle()
      : await existingQuery.eq("source_url", sourceUrls[0]!).maybeSingle();

    const sourceId = existing?.id ?? crypto.randomUUID();
    const norm = preset?.norm ?? body.norm?.trim() ?? "Normativa LP";
    const normShort = preset?.normShort ?? body.normShort?.trim() ?? "LP";
    const title = preset?.norm ?? body.title?.trim() ?? `Fuente LP — ${norm}`;

    const articleChunks: Awaited<ReturnType<typeof parseLpLegalArticles>>[] = [];
    let waybackTimestamp: string | undefined;
    for (const url of sourceUrls) {
      const fetched = await fetchUrlContentDetailed(url);
      if (fetched.fetchMode === "wayback") {
        waybackTimestamp = fetched.waybackTimestamp;
      }
      articleChunks.push(
        parseLpLegalArticles(fetched.html, {
          norm,
          normShort,
          sourceId,
          sourceUrl: url,
          syncedAt,
        }),
      );
    }

    const articles = mergeLegalArticleRecords(articleChunks);

    if (!articles.length) {
      return NextResponse.json(
        {
          error:
            "No se pudieron extraer artículos de las URLs indicadas. LP puede haber cambiado su formato.",
        },
        { status: 422 },
      );
    }

    const extractedText = truncateExtractedText(buildExtractedSummary(articles));
    const urlsNote =
      sourceUrls.length > 1
        ? `Sincronizado desde ${sourceUrls.length} URLs LP.`
        : `Sincronizado desde ${sourceUrls[0]}`;
    const waybackNote = waybackTimestamp ? buildWaybackSyncNote(waybackTimestamp) : "";

    const payload = {
      user_id: user.id,
      title,
      category: "normativa" as const,
      kind: "url" as const,
      author: "LP Pasión por el Derecho",
      description: `${preset?.description ?? urlsNote}${waybackNote}`,
      source_url: sourceUrls[0],
      sync_urls: sourceUrls,
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

    if (preset?.id && body.sourceUrls?.length) {
      const currentSettings = await admin
        .schema("public")
        .from("legal_source_settings")
        .select("lp_preset_urls")
        .eq("user_id", user.id)
        .maybeSingle();

      const lpPresetUrls = {
        ...((currentSettings.data?.lp_preset_urls as Record<string, string[]> | null) ?? {}),
        [preset.id]: sourceUrls,
      };

      await admin.schema("public").from("legal_source_settings").upsert(
        {
          user_id: user.id,
          lp_preset_urls: lpPresetUrls,
          updated_at: syncedAt,
        },
        { onConflict: "user_id" },
      );
    }

    return NextResponse.json({
      source: rowToClientSource(row),
      articleCount: articles.length,
      syncedAt,
      sourceUrls,
      fetchMode: waybackTimestamp ? "wayback" : "direct",
      waybackDate: waybackTimestamp ? waybackTimestamp.slice(0, 8) : undefined,
    });
  } catch (caught) {
    console.error("[legal-sources/sync-url]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al sincronizar fuente web." },
      { status: 500 },
    );
  }
}
