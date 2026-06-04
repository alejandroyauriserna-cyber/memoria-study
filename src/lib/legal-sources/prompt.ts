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
MODO ESTRICTO ACADÉMICO ACTIVO:
- Responde ÚNICAMENTE con las fuentes autorizadas listadas abajo Y el texto del PDF en estudio.
- El PDF que el estudiante está leyendo SIEMPRE está autorizado como fuente principal.
- Si la respuesta no está en esas fuentes ni en el PDF, responde exactamente:
  "No encontré esta información dentro de las fuentes autorizadas por el usuario."
- NO uses conocimiento general del modelo fuera de las fuentes autorizadas.
- Cuando haya contradicción, indica qué fuente prevalece según la jerarquía.
`
    : `
Usa prioritariamente las fuentes autorizadas. Complementa con el PDF en estudio cuando la fuente no cubra el punto.
`;

  return `
FUENTES JURÍDICAS AUTORIZADAS POR EL ESTUDIANTE (orden de prioridad):
${priorityList}
${strictBlock}
CONTENIDO DE FUENTES ACTIVAS:
${excerpts || "(Sin extractos cargados para fuentes personalizadas — usa metadatos y PDF en estudio.)"}

CITACIÓN OBLIGATORIA en cada respuesta:
Incluye en citations: sourceId, sourceTitle, article, page, author, fragment, updatedAt cuando aplique.
`.trim();
}

export function getActiveSourceTitles(settings: LegalSourcesSettings): string[] {
  return settings.sources.filter((s) => s.enabled).map((s) => s.title);
}
