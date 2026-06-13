import { getBuiltinSourceExcerpt } from "@/lib/legal-sources/defaults";
import type { LegalSourceRecord, LegalSourcesSettings } from "@/types/legal-sources";

export function buildLegalSourcesPromptBlock(
  enabledSources: LegalSourceRecord[],
  strictMode: boolean,
): string {
  if (!enabledSources.length) {
    return strictMode
      ? "No hay fuentes activadas. Debes responder: \"No encontré esta información dentro de las fuentes autorizadas por el usuario.\""
      : "No hay fuentes jurídicas activadas por el estudiante.";
  }

  const priorityList = enabledSources
    .map((s, i) => `${i + 1}. ${s.title}${s.author ? ` (${s.author})` : ""}`)
    .join("\n");

  const excerpts = enabledSources
    .map((s) => {
      if (s.kind === "builtin") {
        if (s.category === "normativa") return null;
        const text = getBuiltinSourceExcerpt(s.id);
        return text ? `=== ${s.title} (id: ${s.id}) ===\n${text}` : null;
      }
      if (s.kind === "url") {
        const urlList = s.syncUrls?.length ? s.syncUrls : s.sourceUrl ? [s.sourceUrl] : [];
        const isNormativeLp = Boolean(s.lpPresetId);
        const syncMeta = [
          urlList.length ? `URLs: ${urlList.join(" | ")}` : null,
          s.lastSyncedAt ? `Sincronizado: ${s.lastSyncedAt}` : null,
          isNormativeLp && s.articleCount
            ? `${s.articleCount} artículos indexados`
            : s.extractedText
              ? "Texto documento indexado (sin validación artículo a artículo)"
              : null,
        ]
          .filter(Boolean)
          .join(" · ");
        const tag = isNormativeLp ? "LP Derecho" : "Documento web";
        const body = s.extractedText?.trim() || s.description || "";
        return `=== ${s.title} (id: ${s.id}) — ${tag} ===\n${syncMeta}${body ? `\n${body}` : ""}`;
      }
      if (s.extractedText?.trim()) {
        const meta = [s.author ? `Autor: ${s.author}` : null, s.description].filter(Boolean).join(" — ");
        return `=== ${s.title} (id: ${s.id}) ===\n${meta ? `${meta}\n` : ""}${s.extractedText}`;
      }
      if (s.description) {
        return `=== ${s.title} (id: ${s.id}) ===\n${s.description}`;
      }
      return null;
    })
    .filter(Boolean)
    .join("\n\n");

  const strictBlock = strictMode
    ? `
MODO ESTRICTO ACADÉMICO ACTIVO (solo consultas libres / chat):
- En preguntas personalizadas del estudiante, responde con las fuentes autorizadas listadas abajo Y el PDF en estudio.
- El PDF que el estudiante está leyendo SIEMPRE está autorizado como fuente principal de enseñanza.
- Si una pregunta puntual no está en esas fuentes ni en el PDF, responde:
  "No encontré esta información dentro de las fuentes autorizadas por el usuario."
`
    : `
Las fuentes activadas ENRIQUECEN la explicación con normativa/jurisprudencia verificada cuando hay coincidencia.
La enseñanza principal siempre viene del PDF de la página; las fuentes no bloquean ni sustituyen esa explicación.
`;

  return `
FUENTES JURÍDICAS ACTIVADAS (capa de refuerzo normativo — orden de prioridad):
${priorityList}
${strictBlock}
CONTENIDO DE FUENTES ACTIVAS (usar para citations verificadas y peruLaw cuando aplique):
${excerpts || "(Sin extractos cargados — enseña desde el PDF; cita norma solo si aparece en BASE JURÍDICA INDEXADA.)"}

CITACIÓN en citations: sourceId, sourceTitle, article, fragment solo cuando el artículo esté verificado en la base indexada.
`.trim();
}

export function getActiveSourceTitles(settings: LegalSourcesSettings): string[] {
  return settings.sources.filter((s) => s.enabled).map((s) => s.title);
}
