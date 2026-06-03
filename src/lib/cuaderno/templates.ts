import { serializeNoteContent } from "@/lib/cuaderno/note-meta";
import { bodyToEditorHtml } from "@/lib/cuaderno/rich-text";

export type CuadernoTemplateId =
  | "blank"
  | "grid"
  | "ruled"
  | "cornell"
  | "legal"
  | "summary"
  | "research"
  | "flashcards"
  | "legal-caso"
  | "legal-sentencia"
  | "legal-interpretacion"
  | "legal-dictamen"
  | "legal-ficha"
  | "legal-comentario";

export type CuadernoTemplate = {
  id: CuadernoTemplateId;
  label: string;
  description: string;
  category: "base" | "juridica";
  icon: string;
  initialBody: string;
};

export const CUADERNO_TEMPLATES: CuadernoTemplate[] = [
  {
    id: "blank",
    label: "Blanco",
    description: "Hoja limpia, ideal para apuntes libres",
    category: "base",
    icon: "📄",
    initialBody: "",
  },
  {
    id: "grid",
    label: "Cuadriculado",
    description: "Cuadrícula fina para esquemas y diagramas",
    category: "base",
    icon: "▦",
    initialBody: "",
  },
  {
    id: "ruled",
    label: "Rayado",
    description: "Líneas horizontales clásicas",
    category: "base",
    icon: "≡",
    initialBody: "",
  },
  {
    id: "cornell",
    label: "Cornell",
    description: "Cues, notas y resumen en columnas",
    category: "base",
    icon: "▤",
    initialBody: `## Preguntas clave\n\n-\n\n## Apuntes\n\n\n## Resumen\n\n`,
  },
  {
    id: "research",
    label: "Investigación",
    description: "Puntos, fuentes y análisis",
    category: "base",
    icon: "🔬",
    initialBody: `## Problema de investigación\n\n\n## Hipótesis\n\n\n## Fuentes\n\n\n## Análisis\n\n`,
  },
  {
    id: "summary",
    label: "Resumen",
    description: "Síntesis estructurada para repaso",
    category: "base",
    icon: "📋",
    initialBody: `## Idea central\n\n\n## Puntos clave\n\n1.\n2.\n3.\n\n## Para el examen\n\n`,
  },
  {
    id: "flashcards",
    label: "Flashcards",
    description: "Pregunta y respuesta por bloques",
    category: "base",
    icon: "🃏",
    initialBody: `## Tarjeta 1\nPregunta:\n\nRespuesta:\n\n---\n\n## Tarjeta 2\nPregunta:\n\nRespuesta:\n\n`,
  },
  {
    id: "legal",
    label: "Papel jurídico",
    description: "Márgenes y líneas académicas",
    category: "base",
    icon: "⚖",
    initialBody: `## Tema\n\n\n## Conceptos\n\n\n## Doctrina / norma\n\n\n## Conclusión parcial\n\n`,
  },
  {
    id: "legal-caso",
    label: "Caso práctico jurídico",
    description: "Hechos, problema y conclusión",
    category: "juridica",
    icon: "📁",
    initialBody: `## HECHOS\n\n\n## PROBLEMA JURÍDICO\n\n\n## NORMATIVA\n\n\n## ANÁLISIS\n\n\n## CONCLUSIÓN\n\n`,
  },
  {
    id: "legal-sentencia",
    label: "Comentario de sentencia",
    description: "Datos del caso y análisis crítico",
    category: "juridica",
    icon: "⚖",
    initialBody: `## Datos del caso\n\n\n## Hechos\n\n\n## Fundamentos\n\n\n## Análisis crítico\n\n\n## Conclusión\n\n`,
  },
  {
    id: "legal-interpretacion",
    label: "Interpretación normativa",
    description: "Artículo y método interpretativo",
    category: "juridica",
    icon: "📜",
    initialBody: `## Artículo\n\n\n## Problema interpretativo\n\n\n## Método utilizado\n\n\n## Conclusión\n\n`,
  },
  {
    id: "legal-dictamen",
    label: "Dictamen jurídico",
    description: "Consulta, análisis y opinión",
    category: "juridica",
    icon: "✒",
    initialBody: `## Consulta\n\n\n## Antecedentes\n\n\n## Análisis\n\n\n## Opinión / conclusión\n\n`,
  },
  {
    id: "legal-ficha",
    label: "Ficha jurisprudencial",
    description: "Precedente, tesis y aplicación",
    category: "juridica",
    icon: "📑",
    initialBody: `## Tribunal / expediente\n\n\n## Tesis\n\n\n## Hechos relevantes\n\n\n## Aplicación al caso\n\n`,
  },
  {
    id: "legal-comentario",
    label: "Jurisprudencia relacionada",
    description: "Precedente y crítica doctrinal",
    category: "juridica",
    icon: "🏛",
    initialBody: `## Precedente\n\n\n## Tesis del tribunal\n\n\n## Relevancia\n\n\n## Crítica / aplicación\n\n`,
  },
];

export function getTemplate(id: CuadernoTemplateId): CuadernoTemplate {
  return CUADERNO_TEMPLATES.find((t) => t.id === id) ?? CUADERNO_TEMPLATES[0];
}

export function buildInitialNotes(templateId: CuadernoTemplateId): string {
  const template = getTemplate(templateId);
  return serializeNoteContent({ templateId }, bodyToEditorHtml(template.initialBody));
}
