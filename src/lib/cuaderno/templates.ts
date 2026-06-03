import { serializeNoteContent } from "@/lib/cuaderno/note-meta";

export type CuadernoTemplateId =
  | "blank"
  | "grid"
  | "ruled"
  | "cornell"
  | "legal"
  | "summary"
  | "research"
  | "legal-caso"
  | "legal-sentencia"
  | "legal-interpretacion"
  | "legal-dictamen"
  | "legal-comentario";

export type CuadernoTemplate = {
  id: CuadernoTemplateId;
  label: string;
  description: string;
  category: "base" | "juridica";
  pattern: "blank" | "grid" | "ruled" | "cornell" | "legal";
  initialBody: string;
};

export const CUADERNO_TEMPLATES: CuadernoTemplate[] = [
  {
    id: "blank",
    label: "Hoja blanca",
    description: "Lienzo limpio para apuntes libres",
    category: "base",
    pattern: "blank",
    initialBody: "",
  },
  {
    id: "grid",
    label: "Cuadriculada",
    description: "Ideal para esquemas y diagramas",
    category: "base",
    pattern: "grid",
    initialBody: "",
  },
  {
    id: "ruled",
    label: "Rayada",
    description: "Clásica para escritura continua",
    category: "base",
    pattern: "ruled",
    initialBody: "",
  },
  {
    id: "cornell",
    label: "Cornell",
    description: "Preguntas, notas y resumen",
    category: "base",
    pattern: "cornell",
    initialBody: `## Preguntas clave\n\n-\n\n## Apuntes\n\n\n## Resumen\n\n`,
  },
  {
    id: "legal",
    label: "Jurídica",
    description: "Estructura académica general",
    category: "base",
    pattern: "legal",
    initialBody: `## Tema\n\n\n## Conceptos\n\n\n## Doctrina / norma\n\n\n## Conclusión parcial\n\n`,
  },
  {
    id: "summary",
    label: "Resumen",
    description: "Síntesis para repaso",
    category: "base",
    pattern: "ruled",
    initialBody: `## Idea central\n\n\n## Puntos clave\n\n1.\n2.\n3.\n\n## Para el examen\n\n`,
  },
  {
    id: "research",
    label: "Investigación",
    description: "Hipótesis, fuentes y análisis",
    category: "base",
    pattern: "grid",
    initialBody: `## Problema de investigación\n\n\n## Hipótesis\n\n\n## Fuentes\n\n\n## Análisis\n\n`,
  },
  {
    id: "legal-caso",
    label: "Caso práctico",
    description: "Hechos, problema y conclusión",
    category: "juridica",
    pattern: "legal",
    initialBody: `## HECHOS\n\n\n## PROBLEMA JURÍDICO\n\n\n## NORMATIVA\n\n\n## ANÁLISIS\n\n\n## CONCLUSIÓN\n\n`,
  },
  {
    id: "legal-sentencia",
    label: "Comentario de sentencia",
    description: "Datos del caso y análisis crítico",
    category: "juridica",
    pattern: "legal",
    initialBody: `## Datos del caso\n\n\n## Hechos\n\n\n## Fundamentos\n\n\n## Análisis crítico\n\n\n## Conclusión\n\n`,
  },
  {
    id: "legal-interpretacion",
    label: "Interpretación normativa",
    description: "Artículo y método interpretativo",
    category: "juridica",
    pattern: "legal",
    initialBody: `## Artículo\n\n\n## Problema interpretativo\n\n\n## Método utilizado\n\n\n## Conclusión\n\n`,
  },
  {
    id: "legal-dictamen",
    label: "Dictamen",
    description: "Consulta, análisis y opinión",
    category: "juridica",
    pattern: "legal",
    initialBody: `## Consulta\n\n\n## Antecedentes\n\n\n## Análisis\n\n\n## Opinión / conclusión\n\n`,
  },
  {
    id: "legal-comentario",
    label: "Comentario jurisprudencial",
    description: "Tesis y relevancia del precedente",
    category: "juridica",
    pattern: "legal",
    initialBody: `## Precedente\n\n\n## Tesis del tribunal\n\n\n## Relevancia\n\n\n## Crítica / aplicación\n\n`,
  },
];

export function getTemplate(id: CuadernoTemplateId): CuadernoTemplate {
  return CUADERNO_TEMPLATES.find((t) => t.id === id) ?? CUADERNO_TEMPLATES[0];
}

export function buildInitialNotes(templateId: CuadernoTemplateId): string {
  const template = getTemplate(templateId);
  return serializeNoteContent({ templateId }, template.initialBody);
}
