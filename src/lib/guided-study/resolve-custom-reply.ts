import type { PageProfessorAnalysis, TutorResponse } from "@/types/guided-legal-study";

/** Respuesta directa del modelo o campo alternativo. */
function directReply(parsed: TutorResponse): string | undefined {
  const reply = parsed.customReply?.trim();
  if (reply) return reply;
  return undefined;
}

/** Construye texto de chat desde un análisis cuando el modelo omitió customReply. */
export function buildCustomReplyFromAnalysis(
  analysis: PageProfessorAnalysis,
  question?: string,
): string | undefined {
  const parts: string[] = [];

  if (analysis.pageFocus?.trim()) {
    parts.push(analysis.pageFocus.trim());
  }

  const q = question?.toLowerCase() ?? "";
  const rankedCards = [...analysis.conceptCards].sort((a, b) => {
    const score = (card: typeof a) => {
      const blob = `${card.concept} ${card.explanation}`.toLowerCase();
      if (!q) return 0;
      const tokens = q.split(/\s+/).filter((w) => w.length > 4);
      return tokens.reduce((acc, token) => (blob.includes(token) ? acc + 1 : acc), 0);
    };
    return score(b) - score(a);
  });

  const best = rankedCards.find((c) => c.explanation?.trim());
  if (best?.explanation?.trim()) {
    parts.push(best.explanation.trim());
  }

  if (analysis.comprehensionQuestion?.trim() && parts.length < 2) {
    parts.push(analysis.comprehensionQuestion.trim());
  }

  const text = parts.join("\n\n").trim();
  return text.length >= 20 ? text : undefined;
}

export function resolveCustomChatReply(
  parsed: TutorResponse,
  question?: string,
): string | undefined {
  const direct = directReply(parsed);
  if (direct) return direct;

  if (parsed.analysis) {
    return buildCustomReplyFromAnalysis(parsed.analysis, question);
  }

  return undefined;
}

/** Si el modelo devolvió texto plano en lugar de JSON. */
export function extractPlainTextFallback(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith("{")) return undefined;
  if (trimmed.includes('"pageFocus"') || trimmed.includes('"conceptCards"')) return undefined;
  return trimmed.length >= 20 ? trimmed : undefined;
}
