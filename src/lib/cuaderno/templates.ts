import { serializeNoteContent } from "@/lib/cuaderno/note-meta";
import { bodyToEditorHtml } from "@/lib/cuaderno/rich-text";

export type CuadernoTemplateId =
  | "blank"
  | "ivory"
  | "beige"
  | "dark-sheet"
  | "grid"
  | "grid-fine"
  | "grid-bold"
  | "ruled"
  | "ruled-uni"
  | "ruled-legal"
  | "cornell"
  | "research"
  | "summary"
  | "expo"
  | "magistral"
  | "seminar"
  | "concept-map"
  | "compare-grid"
  | "flashcards"
  | "legal"
  | "legal-caso"
  | "legal-sentencia"
  | "legal-interpretacion"
  | "legal-dictamen"
  | "legal-ficha"
  | "legal-comentario"
  | "legal-casacion"
  | "legal-contrato"
  | "legal-doctrina"
  | "legal-resumen-clase"
  | "legal-prep-examen"
  | "study-exam"
  | "study-qa"
  | "study-quick"
  | "study-memorize";

export type CuadernoTemplateCategory = "basica" | "academica" | "juridica" | "estudio";

export type CuadernoTemplate = {
  id: CuadernoTemplateId;
  label: string;
  description: string;
  category: CuadernoTemplateCategory;
  icon: string;
  initialBody: string;
};

export const TEMPLATE_GALLERY_GROUPS: Array<{ key: CuadernoTemplateCategory; title: string }> = [
  { key: "basica", title: "Hojas básicas" },
  { key: "academica", title: "Hojas académicas" },
  { key: "juridica", title: "Hojas jurídicas" },
  { key: "estudio", title: "Hojas de estudio" },
];

export function templatesByCategory(category: CuadernoTemplateCategory): CuadernoTemplate[] {
  return CUADERNO_TEMPLATES.filter((t) => t.category === category);
}

export const CUADERNO_TEMPLATES: CuadernoTemplate[] = [
  {
    id: "blank",
    label: "Blanco",
    description: "Hoja limpia, ideal para apuntes libres",
    category: "basica",
    icon: "📄",
    initialBody: "",
  },
  {
    id: "grid",
    label: "Cuadriculado",
    description: "Cuadrícula fina para esquemas y diagramas",
    category: "basica",
    icon: "▦",
    initialBody: "",
  },
  {
    id: "ruled",
    label: "Rayado",
    description: "Líneas horizontales clásicas",
    category: "basica",
    icon: "≡",
    initialBody: "",
  },
  {
    id: "cornell",
    label: "Cornell",
    description: "Cues, notas y resumen en columnas",
    category: "academica",
    icon: "▤",
    initialBody: `## Preguntas clave\n\n-\n\n## Apuntes\n\n\n## Resumen\n\n`,
  },
  {
    id: "research",
    label: "Investigación",
    description: "Puntos, fuentes y análisis",
    category: "academica",
    icon: "🔬",
    initialBody: `## Problema de investigación\n\n\n## Hipótesis\n\n\n## Fuentes\n\n\n## Análisis\n\n`,
  },
  {
    id: "summary",
    label: "Resumen",
    description: "Síntesis estructurada para repaso",
    category: "academica",
    icon: "📋",
    initialBody: `## Idea central\n\n\n## Puntos clave\n\n1.\n2.\n3.\n\n## Para el examen\n\n`,
  },
  {
    id: "flashcards",
    label: "Flashcards",
    description: "Pregunta y respuesta por bloques",
    category: "estudio",
    icon: "🃏",
    initialBody: `## Tarjeta 1\nPregunta:\n\nRespuesta:\n\n---\n\n## Tarjeta 2\nPregunta:\n\nRespuesta:\n\n`,
  },
  {
    id: "legal",
    label: "Papel jurídico",
    description: "Márgenes y líneas académicas",
    category: "basica",
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
  { id: "ivory", label: "Marfil", description: "Fondo cálido tipo papel antiguo", category: "basica", icon: "📃", initialBody: "" },
  { id: "beige", label: "Beige", description: "Tono arena para lectura prolongada", category: "basica", icon: "📜", initialBody: "" },
  { id: "dark-sheet", label: "Oscura", description: "Modo oscuro para estudio nocturno", category: "basica", icon: "🌙", initialBody: "" },
  { id: "grid-fine", label: "Cuadriculada fina", description: "Rejilla de 12 mm para diagramas", category: "basica", icon: "▦", initialBody: "" },
  { id: "grid-bold", label: "Cuadriculada gruesa", description: "Rejilla marcada cada 2 cm", category: "basica", icon: "▩", initialBody: "" },
  { id: "ruled-uni", label: "Rayada universitaria", description: "Líneas amplias con margen", category: "basica", icon: "≡", initialBody: "" },
  { id: "ruled-legal", label: "Rayada legal", description: "Líneas finas estilo expediente", category: "basica", icon: "≣", initialBody: "" },
  { id: "expo", label: "Exposición", description: "Intro, desarrollo y cierre", category: "academica", icon: "🎤", initialBody: `## Introducción\n\n\n## Desarrollo\n\n\n## Conclusión\n\n` },
  { id: "magistral", label: "Clase magistral", description: "Apuntes de cátedra estructurados", category: "academica", icon: "🏫", initialBody: `## Tema\n\n\n## Ideas del profesor\n\n\n## Ejemplos\n\n\n## Para repasar\n\n` },
  { id: "seminar", label: "Seminario", description: "Debate, lecturas y aportes", category: "academica", icon: "💬", initialBody: `## Lectura\n\n\n## Preguntas del seminario\n\n\n## Aportes\n\n` },
  { id: "concept-map", label: "Mapa conceptual", description: "Nodos y relaciones visuales", category: "academica", icon: "◎", initialBody: `## Concepto central\n\n\n## Ramas\n\n-\n-\n` },
  { id: "compare-grid", label: "Cuadro comparativo", description: "Columnas para contrastar tesis", category: "academica", icon: "▦", initialBody: `## Criterio\n\n| Elemento A | Elemento B |\n|---|---|\n| | |\n` },
  { id: "legal-casacion", label: "Casación", description: "Requisitos y decisión del tribunal", category: "juridica", icon: "⚖", initialBody: `## Vía casacional\n\n\n## Requisitos\n\n\n## Decisión\n\n` },
  { id: "legal-doctrina", label: "Comentario doctrinal", description: "Autor, tesis y crítica", category: "juridica", icon: "📖", initialBody: `## Autor / obra\n\n\n## Tesis\n\n\n## Crítica\n\n` },
  { id: "legal-resumen-clase", label: "Resumen de clase", description: "Síntesis de cátedra con puntos clave", category: "juridica", icon: "⚖", initialBody: `## Tema de la clase\n\n\n## Ideas centrales\n\n\n## Para el examen\n\n` },
  { id: "legal-prep-examen", label: "Preparación de examen", description: "Checklist y repaso estructurado", category: "juridica", icon: "⚖", initialBody: `## Temas del examen\n\n\n## Preguntas probables\n\n\n## Artículos clave\n\n` },
  { id: "legal-contrato", label: "Contrato", description: "Cláusulas, riesgos y conclusiones", category: "juridica", icon: "📝", initialBody: `## Partes\n\n\n## Objeto\n\n\n## Cláusulas clave\n\n\n## Riesgos\n\n` },
  { id: "study-exam", label: "Examen", description: "Simulacro y respuestas modelo", category: "estudio", icon: "📝", initialBody: `## Pregunta 1\n\n\n## Pregunta 2\n\n` },
  { id: "study-qa", label: "Preguntas y respuestas", description: "Formato QA para repaso", category: "estudio", icon: "?", initialBody: `**P:** \n\n**R:** \n\n` },
  { id: "study-quick", label: "Repaso rápido", description: "Bullets de último momento", category: "estudio", icon: "⚡", initialBody: `- \n- \n- \n` },
  { id: "study-memorize", label: "Memorización", description: "Mnemotecnias y listas", category: "estudio", icon: "🧠", initialBody: `## Lista\n\n1.\n2.\n3.\n\n## Mnemotecnia\n\n` },
];

export function getTemplate(id: CuadernoTemplateId): CuadernoTemplate {
  return CUADERNO_TEMPLATES.find((t) => t.id === id) ?? CUADERNO_TEMPLATES[0];
}

export function buildInitialNotes(templateId: CuadernoTemplateId): string {
  const template = getTemplate(templateId);
  return serializeNoteContent({ templateId }, bodyToEditorHtml(template.initialBody));
}
