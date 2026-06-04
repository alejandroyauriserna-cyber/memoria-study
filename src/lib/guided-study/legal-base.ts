import type { LegalCitation } from "@/types/guided-legal-study";

export type LegalArticleRecord = {
  id: string;
  norm: string;
  normShort: string;
  article: string;
  title: string;
  text: string;
  keywords: string[];
  updatedAt: string;
  /** Fuente web sincronizada (LP Derecho). */
  syncSourceId?: string;
  syncSourceTitle?: string;
  syncSourceUrl?: string;
  syncProvider?: string;
};

/** Base jurídica oficial curada — LEGACY: no se usa en validación del tutor; solo LP sincronizado. */
export const LEGAL_BASE_UPDATED_AT = "2026-03-01";

export const PERU_LEGAL_ARTICLES: LegalArticleRecord[] = [
  {
    id: "cpp-art-1",
    norm: "Constitución Política del Perú",
    normShort: "CPP",
    article: "Artículo 1",
    title: "Defensa de la persona humana",
    text: "La defensa de la persona humana y el respeto de su dignidad son el fin supremo de la sociedad y del Estado.",
    keywords: ["dignidad", "persona humana", "fin supremo", "constitucional"],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cpp-art-2",
    norm: "Constitución Política del Perú",
    normShort: "CPP",
    article: "Artículo 2",
    title: "Derechos fundamentales",
    text: "Toda persona tiene derecho a la vida, a su identidad, a su integridad moral, psíquica y física y a su libre desarrollo y bienestar.",
    keywords: ["derechos fundamentales", "vida", "identidad", "integridad"],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cpp-art-139",
    norm: "Constitución Política del Perú",
    normShort: "CPP",
    article: "Artículo 139",
    title: "Principios del proceso",
    text: "Son principios del proceso la independencia de la magistratura, la legalidad, la igualdad, la publicidad, el derecho de defensa, la inmediación, la oralidad y la concentración.",
    keywords: ["proceso", "principios procesales", "oralidad", "inmediación", "legalidad"],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cc-art-1",
    norm: "Código Civil",
    normShort: "CC",
    article: "Artículo 1",
    title: "Fuentes del derecho",
    text: "Las leyes, después de ser publicadas en el Diario Oficial El Peruano, son obligatorias por el solo hecho de haber sido dictadas.",
    keywords: ["fuentes del derecho", "ley", "obligatoriedad", "publicación"],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cc-art-2",
    norm: "Código Civil",
    normShort: "CC",
    article: "Artículo 2",
    title: "Ignorancia de la ley",
    text: "Nadie puede alegar desconocimiento de la ley, salvo que la misma lo autorice.",
    keywords: ["ignorancia", "ley", "desconocimiento"],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cc-art-44",
    norm: "Código Civil",
    normShort: "CC",
    article: "Artículo 44",
    title: "Persona natural",
    text: "Es persona toda ser humano.",
    keywords: ["persona", "persona natural", "capacidad"],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cc-art-75",
    norm: "Código Civil",
    normShort: "CC",
    article: "Artículo 75",
    title: "Indivisibilidad de las obligaciones",
    text: "Son indivisibles las obligaciones cuando su objeto, por su naturaleza o por disposición de la ley o de las partes, no es susceptible de cumplimiento parcial.",
    keywords: ["obligaciones", "indivisibles", "cumplimiento", "deudores"],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cc-art-140",
    norm: "Código Civil",
    normShort: "CC",
    article: "Artículo 140",
    title: "Acto jurídico",
    text: "El acto jurídico es la declaración o manifestación de voluntad destinada a crear, modificar o extinguir derechos y obligaciones.",
    keywords: [
      "acto jurídico",
      "acto juridico",
      "voluntad",
      "declaración",
      "manifestación",
      "derechos",
      "obligaciones",
    ],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cc-art-168",
    norm: "Código Civil",
    normShort: "CC",
    article: "Artículo 168",
    title: "Interpretación de la declaración de voluntad",
    text: "La interpretación de la declaración de voluntad deberá hacerse en atención al sentido propio del acto jurídico, y no a las palabras que se hayan empleado.",
    keywords: [
      "interpretación",
      "interpretacion",
      "declaración de voluntad",
      "acto jurídico",
      "sentido",
    ],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cc-art-169",
    norm: "Código Civil",
    normShort: "CC",
    article: "Artículo 169",
    title: "Reglas de interpretación",
    text: "Para interpretar las declaraciones de voluntad se atenderá a la intención de los contratantes o partes, más que al sentido literal de las palabras.",
    keywords: [
      "interpretación",
      "interpretacion",
      "declaraciones de voluntad",
      "intención",
      "contratantes",
    ],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cc-art-144",
    norm: "Código Civil",
    normShort: "CC",
    article: "Artículo 144",
    title: "Contrato",
    text: "Contrato es el acuerdo de dos o más partes para crear, modificar o extinguir una obligación.",
    keywords: ["contrato", "obligación", "acuerdo", "partes"],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cc-art-962",
    norm: "Código Civil",
    normShort: "CC",
    article: "Artículo 962",
    title: "Obligación",
    text: "Obligación es la sujeción activa o pasiva de una persona con respecto a otra, a dar, hacer o no hacer alguna cosa.",
    keywords: ["obligación", "dar", "hacer", "no hacer", "sujeción"],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cpc-art-1",
    norm: "Código Procesal Civil",
    normShort: "CPC",
    article: "Artículo 1",
    title: "Finalidad del proceso civil",
    text: "El proceso civil tiene por finalidad resolver, mediante el procedimiento legalmente previsto, las controversias sobre derechos y obligaciones de contenido patrimonial o extrapatrimonial.",
    keywords: ["proceso civil", "controversia", "derechos", "obligaciones"],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cpc-art-2",
    norm: "Código Procesal Civil",
    normShort: "CPC",
    article: "Artículo 2",
    title: "Principios del proceso civil",
    text: "El proceso civil se rige por los principios de legalidad, igualdad, publicidad, contradicción, inmediación, concentración, celeridad, economía procesal y buena fe.",
    keywords: ["principios", "proceso civil", "contradicción", "celeridad", "buena fe"],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cp-art-1",
    norm: "Código Penal",
    normShort: "CP",
    article: "Artículo 1",
    title: "Principio de legalidad penal",
    text: "Nadie puede ser sancionado por una acción u omisión que no esté prevista en la ley como delito, ni sometido a penas o medidas de seguridad que no estén establecidas en ella.",
    keywords: ["legalidad penal", "delito", "pena", "nullum crimen"],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cp-art-13",
    norm: "Código Penal",
    normShort: "CP",
    article: "Artículo 13",
    title: "Tipicidad",
    text: "Comete delito quien realiza una acción u omisión prevista por la ley como delito.",
    keywords: ["tipicidad", "delito", "acción", "omisión"],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cp-art-15",
    norm: "Código Penal",
    normShort: "CP",
    article: "Artículo 15",
    title: "Antijuridicidad",
    text: "La acción u omisión es antijurídica si lesiona o pone en peligro el bien jurídico protegido por la norma penal, sin que concurra causa de justificación.",
    keywords: ["antijuridicidad", "bien jurídico", "causa de justificación"],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cp-art-16",
    norm: "Código Penal",
    normShort: "CP",
    article: "Artículo 16",
    title: "Culpabilidad",
    text: "Es culpable quien comete el delito con dolo o culpa inexcusable.",
    keywords: ["culpabilidad", "dolo", "culpa", "imputabilidad"],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "cpp-art-200",
    norm: "Constitución Política del Perú",
    normShort: "CPP",
    article: "Artículo 200",
    title: "Poder Judicial",
    text: "El Poder Judicial es autónomo. Los jueces y fiscales ejercen la función jurisdiccional en nombre del pueblo.",
    keywords: ["poder judicial", "juez", "fiscal", "jurisdicción"],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
  {
    id: "lopj-art-1",
    norm: "Ley Orgánica del Poder Judicial",
    normShort: "LOPJ",
    article: "Artículo I",
    title: "Organización del Poder Judicial",
    text: "El Poder Judicial es el órgano del Estado encargado de administrar justicia en nombre de la Nación.",
    keywords: ["poder judicial", "administrar justicia", "organización"],
    updatedAt: LEGAL_BASE_UPDATED_AT,
  },
];

const TOPIC_BOOST: Record<string, string[]> = {
  "acto juridico": ["cc-art-140"],
  "acto jurídico": ["cc-art-140"],
  "negocio juridico": ["cc-art-140"],
  interpretacion: ["cc-art-168", "cc-art-169"],
  interpretación: ["cc-art-168", "cc-art-169"],
  "declaracion de voluntad": ["cc-art-168", "cc-art-169"],
  "declaración de voluntad": ["cc-art-168", "cc-art-169"],
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchLegalBase(
  query: string,
  limit = 6,
  index: LegalArticleRecord[] = PERU_LEGAL_ARTICLES,
): LegalArticleRecord[] {
  const tokens = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\W+/)
    .filter((t) => t.length >= 4);

  if (!tokens.length) {
    return [];
  }

  const topicBoostIds = new Set<string>();
  const normalizedQuery = normalizeText(query);
  for (const [topic, ids] of Object.entries(TOPIC_BOOST)) {
    if (normalizedQuery.includes(normalizeText(topic))) {
      for (const id of ids) topicBoostIds.add(id);
    }
  }

  const scored = index.map((article) => {
    const haystack = [
      article.norm,
      article.normShort,
      article.article,
      article.title,
      article.text,
      ...article.keywords,
    ]
      .join(" ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    let score = 0;
    if (topicBoostIds.has(article.id)) score += 12;
    for (const token of tokens) {
      if (haystack.includes(token)) score += 2;
      for (const kw of article.keywords) {
        if (kw.includes(token) || token.includes(kw)) score += 3;
      }
    }
    return { article, score };
  })
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.article);
}

export function formatLegalBaseForPrompt(articles: LegalArticleRecord[]): string {
  if (!articles.length) {
    return "No se encontraron artículos específicos en la base jurídica para este contenido.";
  }

  return articles
    .map((a) => {
      const sourceNote = a.syncProvider
        ? `\nFuente: ${a.syncProvider}${a.syncSourceUrl ? ` — ${a.syncSourceUrl}` : ""} (sincronizado ${a.updatedAt})`
        : "";
      return `[${a.normShort} — ${a.article}] ${a.title}\nTexto: "${a.text}"\nActualizado: ${a.updatedAt}${sourceNote}`;
    })
    .join("\n\n");
}

export function toLegalCitation(article: LegalArticleRecord): LegalCitation {
  return {
    norm: article.norm,
    article: article.article,
    text: article.text,
    updatedAt: article.updatedAt,
  };
}

export const LEGAL_BASE_SOURCES = [
  "Constitución Política del Perú",
  "Código Civil",
  "Código Procesal Civil",
  "Código Penal",
  "Código Procesal Penal",
  "Ley Orgánica del Poder Judicial",
] as const;
