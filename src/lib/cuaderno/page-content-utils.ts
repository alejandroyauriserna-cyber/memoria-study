import { stripHtml, isHtmlBody } from "@/lib/cuaderno/rich-text";
import type { CuadernoPage } from "@/lib/cuaderno/cuaderno-pages";

const LEGAL_HINTS = [
  "Acto Jurídico",
  "Negocio Jurídico",
  "Interpretación",
  "Voluntad",
  "Capacidad",
  "Nulidad",
  "Prescripción",
  "Responsabilidad Civil",
  "Obligación",
  "Contrato",
  "Daño",
  "Culpa",
  "Antijuridicidad",
  "Persona Jurídica",
  "Derecho Real",
  "Sucesión",
  "Posesión",
  "Dominio",
  "Usufructo",
  "Garantía",
];

export function pagePlainText(body: string): string {
  return isHtmlBody(body) ? stripHtml(body) : body;
}

export function extractLegalConcepts(body: string, max = 4): Array<{ term: string; cite?: string }> {
  const text = pagePlainText(body);
  const found = new Map<string, { term: string; cite?: string }>();

  for (const hint of LEGAL_HINTS) {
    if (text.toLowerCase().includes(hint.toLowerCase())) {
      found.set(hint.toLowerCase(), { term: hint, cite: inferCite(hint) });
    }
  }

  const titleCase = text.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3}\b/g) ?? [];
  for (const phrase of titleCase) {
    if (phrase.length < 8 || phrase.length > 42) continue;
    if (/^(Página|Clase|Unidad|Artículo)\b/i.test(phrase)) continue;
    const key = phrase.toLowerCase();
    if (!found.has(key) && found.size < max) {
      found.set(key, { term: phrase, cite: inferCite(phrase) });
    }
  }

  return [...found.values()].slice(0, max);
}

function inferCite(term: string): string | undefined {
  const lower = term.toLowerCase();
  if (lower.includes("acto") || lower.includes("negocio") || lower.includes("obligación")) {
    return "Art. 140 CC";
  }
  if (lower.includes("contrato")) return "Art. 1357 CC";
  if (lower.includes("prescripción")) return "Art. 2001 CC";
  if (lower.includes("responsabilidad") || lower.includes("daño")) return "Art. 1969 CC";
  return undefined;
}

export type PageUnitGroup = {
  id: string;
  label: string;
  pages: CuadernoPage[];
};

export function groupPagesIntoUnits(pages: CuadernoPage[]): PageUnitGroup[] {
  const groups: PageUnitGroup[] = [];
  let autoIndex = 1;
  let current: PageUnitGroup | null = null;

  for (const page of pages) {
    const unitMatch = page.title.match(/^Unidad\s+(\d+|[IVXLC]+)/i);
    const label = unitMatch ? `Unidad ${unitMatch[1]}` : null;

    if (label) {
      const existing = groups.find((g) => g.label === label);
      if (existing) {
        existing.pages.push(page);
        current = existing;
      } else {
        current = { id: `unit-${label}`, label, pages: [page] };
        groups.push(current);
      }
      continue;
    }

    if (!current || current.pages.length >= 5) {
      current = { id: `unit-auto-${autoIndex}`, label: `Unidad ${autoIndex}`, pages: [] };
      groups.push(current);
      autoIndex += 1;
    }
    current.pages.push(page);
  }

  return groups.filter((g) => g.pages.length > 0);
}

export type AiAnswerCard = {
  icon: string;
  title: string;
  body: string;
};

export function parseAiAnswerCards(answer: string): AiAnswerCard[] {
  const trimmed = answer.trim();
  if (!trimmed) return [];

  const sectionPattern =
    /^(?:#{1,3}\s*)?(?:⚖️|💡|📖|🎓|🧠|📚)?\s*(.+?)\s*:?\s*$/gm;
  const blocks = trimmed.split(/\n{2,}/).filter(Boolean);

  if (blocks.length <= 1) {
    return [
      {
        icon: "⚖️",
        title: inferCardTitle(trimmed),
        body: trimmed.replace(/^[^:]+:\s*/m, "").trim() || trimmed,
      },
    ];
  }

  return blocks.slice(0, 6).map((block, index) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const first = lines[0] ?? `Bloque ${index + 1}`;
    const title = first.replace(/^#{1,3}\s*/, "").replace(/:$/, "");
    const body = lines.slice(1).join("\n") || first;
    return {
      icon: pickIcon(title),
      title: title.replace(/^[⚖️💡📖🎓🧠📚]\s*/, ""),
      body,
    };
  });
}

function inferCardTitle(text: string): string {
  const firstLine = text.split("\n")[0]?.trim() ?? "Respuesta IA";
  return firstLine.slice(0, 48);
}

function pickIcon(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("ejemplo") || lower.includes("caso")) return "💡";
  if (lower.includes("código") || lower.includes("artículo") || lower.includes("art.")) return "📖";
  if (lower.includes("examen") || lower.includes("pregunta")) return "🎓";
  if (lower.includes("flash") || lower.includes("repaso")) return "📚";
  if (lower.includes("simplif")) return "🧠";
  return "⚖️";
}
