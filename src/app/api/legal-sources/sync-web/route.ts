import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import {
  sanitizeWebUrlList,
  validateWebUrlList,
} from "@/lib/legal-sources/allowed-url-domains";
import { fetchUrlContent } from "@/lib/legal-sources/fetch-url-content";
import { getJurisprudenceTemplate } from "@/lib/legal-sources/jurisprudence-templates";
import {
  buildDocumentExtractPreview,
  extractWebDocumentText,
} from "@/lib/legal-sources/parse-web-document";
import { mapDbRowToLegalSource, truncateExtractedText } from "@/lib/legal-sources/server";
import type { LegalSourceCategory } from "@/types/legal-sources";

export const runtime = "nodejs";
export const maxDuration = 120;

const VALID_CATEGORIES = new Set<LegalSourceCategory>(["jurisprudencia", "doctrina"]);

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
      title?: string;
      author?: string;
      category?: LegalSourceCategory;
      sourceUrl?: string;
      sourceUrls?: string[];
      webTemplateId?: string;
    };

    const category = body.category ?? "jurisprudencia";
    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json(
        { error: "Solo jurisprudencia o doctrina admiten sync web de documentos." },
        { status: 400 },
      );
    }

    const sourceUrls = sanitizeWebUrlList(
      body.sourceUrls?.length ? body.sourceUrls : body.sourceUrl ? [body.sourceUrl] : [],
    );

    const validationError = validateWebUrlList(sourceUrls, category);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const template = body.webTemplateId ? getJurisprudenceTemplate(body.webTemplateId) : undefined;
    const title =
      body.title?.trim() ||
      template?.title ||
      (category === "doctrina" ? "Doctrina web" : "Jurisprudencia web");
    const author =
      body.author?.trim() || template?.author || "Fuente web verificada por el estudiante";

    const syncedAt = new Date().toISOString();
    const admin = createAdminClient();

    let existingQuery = admin
      .schema("public")
      .from("legal_sources")
      .select("id")
      .eq("user_id", user.id)
      .eq("kind", "url")
      .eq("category", category);

    if (body.webTemplateId) {
      existingQuery = existingQuery.eq("web_template_id", body.webTemplateId);
    } else {
      existingQuery = existingQuery.eq("source_url", sourceUrls[0]!);
    }

    const { data: existing } = await existingQuery.maybeSingle();
    const sourceId = existing?.id ?? crypto.randomUUID();

    const textChunks: string[] = [];
    for (const url of sourceUrls) {
      const html = await fetchUrlContent(url);
      textChunks.push(`=== ${url} ===\n${extractWebDocumentText(html)}`);
    }

    const fullText = textChunks.join("\n\n");
    if (fullText.trim().length < 80) {
      return NextResponse.json(
        { error: "No se pudo extraer texto suficiente de la URL indicada." },
        { status: 422 },
      );
    }

    const extractedText = truncateExtractedText(buildDocumentExtractPreview(fullText));

    const payload = {
      user_id: user.id,
      title,
      category,
      kind: "url" as const,
      author,
      description:
        "Documento web sincronizado. El tutor cita fragmentos del texto indexado; no valida artículos del código.",
      source_url: sourceUrls[0],
      sync_urls: sourceUrls,
      web_template_id: body.webTemplateId ?? null,
      lp_preset_id: null,
      parsed_articles: null,
      article_count: null,
      extracted_text: extractedText,
      last_synced_at: syncedAt,
      enabled: true,
      priority: 2,
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
      console.error("[legal-sources/sync-web]", error);
      return NextResponse.json({ error: "No se pudo guardar la fuente web." }, { status: 500 });
    }

    return NextResponse.json({
      source: mapDbRowToLegalSource(row),
      syncedAt,
      sourceUrls,
      charCount: fullText.length,
    });
  } catch (caught) {
    console.error("[legal-sources/sync-web]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al sincronizar URL." },
      { status: 500 },
    );
  }
}
